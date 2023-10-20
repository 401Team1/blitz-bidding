'use strict';

const axios = require('axios');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { defaultProvider } = require('@aws-sdk/region-provider');
const { fromIni } = require('@aws-sdk/credential-provider-ini');
const WebSocket = require('ws');
const readline = require('readline');

const REGION = 'us-west-2';
const PROFILE = 'default';

const sqsClient = new SQSClient({ 
    region: REGION, 
    credentials: fromIni({ profile: PROFILE }) 
});
const snsClient = new SNSClient({ 
    region: REGION, 
    credentials: fromIni({ profile: PROFILE }) 
});

const itemReviewQueueUrl = 'https://sqs.us-west-2.amazonaws.com/067714926294/itemReview';
const auctionQueueUrl = 'https://sqs.us-west-2.amazonaws.com/067714926294/liveAuction';

const wsEndpoint = 'wss://noderk8p63.execute-api.us-west-2.amazonaws.com/production/';
let ws;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function setupWebSocket() {
    ws = new WebSocket(wsEndpoint);

    ws.on('open', function open() {
        console.log('WebSocket connection established.');
        ws.send(JSON.stringify({
            action: 'setName',
            name: 'admin',
        }));
    });

    ws.on('message', function incoming(data) {
        const message = JSON.parse(data);
        if(message.type === 'bid') {
            handleWebSocketMessage(message);
        }
    });
}

let currentAuction = null;
let bids = [];

function handleWebSocketMessage(message) {
    console.log("handleWebSocketMessage called with:", message);
    if (message.type === 'bid') {
        bids.push(message.bid);
        console.log("Bid added:", message.bid);
    }
    console.log("Current bids array:", bids);
}

function isItemFilledOut(item) {
    const requiredFields = ['createdBy', 'itemName', 'category', 'description', 'itemType'];
    return requiredFields.every(field => 
        item[field] && 
        item[field].trim() !== '' && 
        !item[field].startsWith('Enter')
    );
}

async function createaAuctionInDB(auctionDetails) {
    const apiUrl = 'https://51d6k7oxwk.execute-api.us-west-2.amazonaws.com/dev/auctions';
    try {
        const response = await axios.post(apiUrl, auctionDetails);
        console.log('Auction created in DB:', response.data);
    } catch (error) {
        console.error('Error creating auction item in DB:', error);
    }
}
async function updateAuctionInDB(auctionDetails, highestBid) {
    const apiUrl = 'https://51d6k7oxwk.execute-api.us-west-2.amazonaws.com/dev/auctions';
    try {
        const updateData = {
            Auctionstatus: 'Won/Closed',
            wonBy: highestBid.bidder,
            winningBid: highestBid.amount.toString(),
        };
        await axios.patch(apiUrl, updateData);
        console.log(`Auction updated in DB. Won by ${updateData.wonBy} with a bid of ${updateData.winningBid}.`);
    } catch (error) {
        console.error('Error updating auction in DB:', error);
    }
}

async function finalizeAuction() {
    // Send finalizeAuction action to the server
    ws.send(JSON.stringify({ "action": "finalizeAuction" }));

    try {
        if (!bids || bids.length === 0) {
            console.error('No bids received for the auction.');
            return;
        }

        bids.sort((a, b) => b.amount - a.amount);
        const highestBid = bids[0];

        await updateAuctionInDB(currentAuction, highestBid);

        sendPublicMessageToAllClients('The auction has ended. If you did not receive a message, your bid was not accepted.');
        sendPrivateMessageToWinner(highestBid.bidder, `Congratulations ${highestBid.bidder}! You've won the auction with a bid of ${highestBid.amount}.`);

        currentAuction = null;
        bids = [];
    } catch (error) {
        console.error('Error finalizing auction:', error);
    }
}

function sendPublicMessageToAllClients(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection not established.');
        return;
    }
    ws.send(JSON.stringify({
        action: 'sendPublic',
        message: message,
    }));
}

function sendPrivateMessageToWinner(winnerId, message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection not established.');
        return;
    }
    ws.send(JSON.stringify({
        action: 'sendPrivate',
        to: winnerId,
        message: message,
    }));
}

async function startAuction(auctionDetails) {
    // Send startAuction action to the server along with auctionItem details
    ws.send(JSON.stringify({ 
        "action": "startAuction",
        "auctionItem": {
            "id": auctionDetails.id,
            "itemName": auctionDetails.itemName,
            "itemType": auctionDetails.itemType,
            "category": auctionDetails.category,
            "description": auctionDetails.description
        }
    }));

    currentAuction = auctionDetails;

    // Notify all connected clients about the new auction
    sendPublicMessageToAllClients(`A new auction has started.`);
    sendPublicMessageToAllClients(`Item: ${auctionDetails.itemName}`);
    sendPublicMessageToAllClients(`Description: ${auctionDetails.description}`);
    sendPublicMessageToAllClients(`Category: ${auctionDetails.category}`);
    sendPublicMessageToAllClients(`Item Type: ${auctionDetails.itemType}`);

    const duration = (new Date(auctionDetails.endTime).getTime() - new Date().getTime());
    setTimeout(finalizeAuction, duration);
}
async function reviewAndStartNextAuction() {
    try {
        const pullParams = {
            QueueUrl: itemReviewQueueUrl,
            MaxNumberOfMessages: 1,
        };

        const response = await sqsClient.send(new ReceiveMessageCommand(pullParams));

        if (response.Messages && response.Messages.length > 0) {
            const message = response.Messages[0];
            const itemDetails = JSON.parse(message.Body);

            console.log('Item review required:', itemDetails);

            // if (isItemFilledOut(itemDetails)) {
            //     console.log('Item approved. Auction can be started by the admin.');

            await createaAuctionInDB(itemDetails);

                rl.question('Enter the auction end time (in minutes):', async (durationInMinutes) => {
                    const endTime = new Date(Date.now() + durationInMinutes * 60 * 1000).toISOString();
                    itemDetails.endTime = endTime;
                    console.log(`Auction will end at ${endTime}`);

                    const auctionPushParams = {
                        QueueUrl: auctionQueueUrl,
                        MessageBody: JSON.stringify(itemDetails)
                    };
                    (async () => {
                        await sqsClient.send(new SendMessageCommand(auctionPushParams));
                        console.log('Item approved and pushed to auction queue.');

                        await startAuction(itemDetails);

                        const deleteParams = {
                            QueueUrl: itemReviewQueueUrl,
                            ReceiptHandle: message.ReceiptHandle,
                        };
                        await sqsClient.send(new DeleteMessageCommand(deleteParams));
                        console.log('Item deleted from review queue.');
                    })();
                });
            // } else {
            //     console.log('Item not approved.');
            // }
        }
    } catch (error) {
        console.error('Error reviewing items:', error);
    }
}

setupWebSocket();

setInterval(reviewAndStartNextAuction, 30000);

module.exports = {
    isItemFilledOut,
    handleWebSocketMessage,
    _test_bids: bids,
    setupWebSocket
};
