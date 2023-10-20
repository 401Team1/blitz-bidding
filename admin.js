'use strict';

const axios = require('axios');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const AWS = require('aws-sdk');

var credentials = new AWS.SharedIniFileCredentials({ profile: 'work-account' });
AWS.config.credentials = credentials;
AWS.config.update({ region: 'us-west-2' });

const itemReviewQueueUrl = 'https://sqs.us-west-2.amazonaws.com/067714926294/itemReview';
const auctionQueueUrl = 'https://sqs.us-west-2.amazonaws.com/067714926294/liveAuction';

const sqsClient = new SQSClient({ region: 'us-west-2' });
const snsClient = new SNSClient({ region: 'us-west-2' });

let currentAuction = null;
let bids = [];

function isItemFilledOut(item) {
    return Object.values(item).every(value => value && value.trim() !== '' && !value.startsWith('Enter'));
}

// Mock WebSocket message handler
function handleWebSocketMessage(message) {
    if (message.type === 'bid') {
        bids.push(message.bid);
    }
    // Handle other WebSocket message types as necessary
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
        bids.sort((a, b) => b.amount - a.amount);
        const highestBid = bids[0];

        await updateAuctionInDB(currentAuction, highestBid);

        console.log(`Congratulations ${highestBid.bidder}! You've won the auction with a bid of ${highestBid.amount}.`);

        console.log('The auction has ended. If you did not receive a message, your bid was not accepted.');
        
        currentAuction = null;
        bids = [];
    } catch (error) {
        console.error('Error finalizing auction:', error);
    }
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

                const endTime = prompt("Enter the auction end time (e.g., '2023-10-17T12:30:00Z'):");
                messageBody.endTime = endTime;

                const auctionPushParams = {
                    QueueUrl: auctionQueueUrl,
                    MessageBody: JSON.stringify(messageBody)
                };
                await sqsClient.send(new SendMessageCommand(auctionPushParams));
                console.log('Item approved and pushed to auction queue.');

                startAuction(messageBody);
            } else {
                console.log('Item not approved.');
            }

            const deleteParams = {
                QueueUrl: itemReviewQueueUrl,
                ReceiptHandle: message.ReceiptHandle,
            };
            await sqsClient.send(new DeleteMessageCommand(deleteParams));
            console.log('Item deleted from review queue.');
        } else {
            console.log('No new items for review.');
        }
    } catch (error) {
        console.error('Error receiving messages:', error);
    }
}

setInterval(reviewAndStartNextAuction, 10 * 1000);

function adminConsole() {
    console.log("Admin Console");
    console.log("1. Manually review and potentially start next auction");
    console.log("2. End current auction manually");
    console.log("3. Exit");

    const choice = prompt("Enter your choice:");

    switch(choice) {
        case "1":
            reviewAndStartNextAuction();
            break;
        case "2":
            if (currentAuction) {
                finalizeAuction();
            } else {
                console.log("No ongoing auction to end.");
            }
            break;
        case "3":
            process.exit();
            break;
        default:
            console.log("Invalid choice.");
            break;
    }
}

adminConsole();


