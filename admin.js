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
        setupAdminNameOnSerever('Admin');
    });

    ws.on('message', function incoming(data) {
        const message = JSON.parse(data);
        if(message.type === 'bid') {
            handleWebSocketMessage(message);
        }
    });
}

function setupAdminNameOnSerever(adminName) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: 'setupAdminName',
            name: adminName,
        }));
    } else {
        console.error('WebSocket connection not established.');
    }
}
let currentAuction = null;
let bids = [];

function handleWebSocketMessage(message) {
    if (message.type === 'bid') {
        bids.push(message.bid);
    }
}

function isItemFilledOut(item) {
    return Object.values(item).every(value => value && value.trim() !== '' && !value.startsWith('Enter'));
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
    try {
        if (!bids || bids.length === 0) {
            console.error('No bids received for the auction.');
            return;
        }

        bids.sort((a, b) => b.amount - a.amount);
        const highestBid = bids[0];

        await updateAuctionInDB(currentAuction, highestBid);

        sendPublicMessageToAllClients('The auction has ended. If you did not recieve a message, your bid was not accepted.');
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
    currentAuction = auctionDetails;

    const duration = (new Date(auctionDetails.endTime).getTime() - Date.now());
    const timerPromise = () => new Promise(resolve => setTimeout(resolve, duration));
    
    console.log(`Auction for ${auctionDetails.itemName} has commenced and will end in ${duration / 1000} seconds.`);
    await timerPromise();

    finalizeAuction();
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
            const messageBody = JSON.parse(message.Body);

            console.log('Item review required:', messageBody);

            if (isItemFilledOut(messageBody)) {
                console.log('Item approved. Auction can be started by the admin.');

                rl.question('Enter the auction end time (in minutes):', (durationInMinutes) => {
                    const endTime = new Date(Date.now() + durationInMinutes * 60 * 1000).toISOString();
                    messageBody.endTime = endTime;
                    console.log(`Auction will end at ${endTime}`);
                    
                    const auctionPushParams = {
                        QueueUrl: auctionQueueUrl,
                        MessageBody: JSON.stringify(messageBody)
                    };
                    (async () => {
                        await sqsClient.send(new SendMessageCommand(auctionPushParams));
                        console.log('Item approved and pushed to auction queue.');

                        startAuction(messageBody);

                        const deleteParams = {
                            QueueUrl: itemReviewQueueUrl,
                            ReceiptHandle: message.ReceiptHandle,
                        };
                        await sqsClient.send(new DeleteMessageCommand(deleteParams));
                        console.log('Item deleted from review queue.');
                    })();
                });
            } else {
                console.log('Item not approved.');
            }
        }
    } catch (error) {
        console.error('Error receiving messages:', error);
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