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

function isItemFilledOut(item) {
    return Object.values(item).every(value => value && value.trim() !== '' && !value.startsWith('Enter'));
}

async function pushItemToLiveAuctionApi(item) {
    const apiUrl = 'https://51d6k7oxwk.execute-api.us-west-2.amazonaws.com/dev/auctions';
    try {
        const response = await axios.post(apiUrl, item);
        console.log('Item successfully pushed to liveAuction API:', response.data);
        return true;
    } catch (error) {
        console.error('Error pushing item to liveAuction API:', error);
        return false;
    }
}

async function receiveMessageFromQueue() {
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

            if (isItemFilledOut(messageBody) && await pushItemToLiveAuctionApi(messageBody)) {
                const auctionPushParams = {
                    QueueUrl: auctionQueueUrl,
                    MessageBody: JSON.stringify(messageBody)
                };
                await sqsClient.send(new SendMessageCommand(auctionPushParams));
                console.log('Item approved and pushed to auction queue.');

                const topicArn = 'arn:aws:sns:us-west-2:067714926294:itemSubmission';
                const notificationMessage = `Auction is beginning for item: ${messageBody.itemName}. Description: ${messageBody.description}`;

                const publishParams = {
                    TopicArn: topicArn,
                    Message: notificationMessage
                };

                await snsClient.send(new PublishCommand(publishParams));
                console.log('Notification sent to subscribers.');
                startAuction();
            } else {
                console.log('Item not approved or failed to push to API.');
            }

            const deleteParams = {
                QueueUrl: itemReviewQueueUrl,
                ReceiptHandle: message.ReceiptHandle,
            };
            await sqsClient.send(new DeleteMessageCommand(deleteParams));
            console.log('Item deleted from review queue.');
        } else {
            console.log('No reviews needed.');
        }
    } catch (error) {
        console.error('Error receiving messages:', error);
    }
}

async function startAuction() {
    const duration = 45 * 1000;
    const timerPromise = () => new Promise(resolve => setTimeout(resolve, duration));
    
    console.log('Auction has commenced.');
    await timerPromise();
    console.log('Auction has finished!');
}

setInterval(() => {
    receiveMessageFromQueue();
}, 10 * 1000);

