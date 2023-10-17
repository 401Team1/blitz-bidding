'use strict';

const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const AWS = require('aws-sdk');

var credentials = new AWS.SharedIniFileCredentials({profile: 'work-account'});
AWS.config.credentials = credentials

AWS.config.update({ region: 'us-west-2' })

const itemReviewQueueUrl = 'https://sqs.us-west-2.amazonaws.com/067714926294/itemReview';
const auctionQueueUrl = 'https://sqs.us-west-2.amazonaws.com/067714926294/liveAuction';

const sqsClient = new SQSClient({ region: 'us-west-2' });
const snsClient = new SNSClient({ region: 'us-west-2' });

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

            if (messageBody.item && messageBody.description) {
                const auctionPushParams = {
                    QueueUrl: liveAuctionQueueUrl,
                    MessageBody: JSON.stringify(messageBody)
                };
                await sqsClient.send(new SendMessageCommand(auctionPushParams));
                console.log('Item approved and pushed to auction queue.');

                const topicArn = 'arn:aws:sns:us-west-2:067714926294:itemSubmission';
                const notificationMessage = `Auction is beginning for item: ${messageBody.item}. Description: ${messageBody.description}`;

                const publishParams = {
                    TopicArn: topicArn,
                    Message: notificationMessage
                };

                try {
                    await snsClient.send(new PublishCommand(publishParams));
                    console.log('Notification sent to subscribers.');
                } catch (error) {
                    console.error('Error sending notification:', error);
                }
                startAuction();
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
            console.log('No reviews needed.');
        }
    } catch (error) {
        console.error('Error receiving messages:', error);
    }
}

async function startAuction() {
    const duraction = 5 * 60 * 1000;
    const timerPromise = () => new Promise(resolve => setTimeout(resolve, duraction));
    
    console.log('Auction has commenced.');

    await timerPromise();

    console.log('Auction has finished!');
}

setInterval(() => {
    receiveMessageFromQueue();
}, 10 * 1000);
