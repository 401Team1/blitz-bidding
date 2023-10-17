'use strict';

const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' })

const queueUrl = '' // Auctions Queue URL

// Pull from review Queue and Push to Auction Queue

async function receiveMessageFromQueue(queueUrl) {
    try {
        // Define the parameters for receiving messages
        const pullParams = {
            QueueUrl: queueUrl,
            Subject: 'Item Apporved' + messagePayload.createdBy,
            Message: messageBody.payload,
            TopicArn: messagePayload.userARN
        };

        // Use the ReceiveMessageCommand to receive messages
        const receiveCommand = new ReceiveMessageCommand(pullParams);
        const response = await sqsClient.send(receiveCommand);

        // Check if there are any messages received
        if (response.Messages && response.Messages.length > 0) {
            const message = response.Messages[0]; // Get the first message
            const messageBody = JSON.parse(message.Body);

            console.log('Item review required:', messageBody);

            // Delete the message from the queue
            const deleteParams = {
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
            };
            const deleteCommand = new DeleteMessageCommand(deleteParams);
            await sqsClient.send(deleteCommand);

            console.log('Item deleted from queue.');
        } else {
            console.log('No reviews needed.');
        }
    } catch (error) {
        console.error('Error receiving messages:', error);
    }
}

receiveMessageFromQueue(queueUrl);

// Start Auction
async function startAuction() {

    const duration = 5 * 60 * 1000; // 5 minutes
    // const duration = 5000; // 5 seconds

    // Wrap the setTimeout in a Promise to make it awaitable
    const timerPromise = () => new Promise(resolve => setTimeout(resolve, duration));

    console.log("Auction has commenced.");

    // Wait for the timer to expire
    await timerPromise();

    console.log("Auction has finished!");
}


const app = Consumer.create({
    queueUrl,
    receiveMessageFromQueue,
    receiveMessageFromQueue: pullParams,
    sqs: new SQSClient({
        region: 'us-west-2',
    })
})

app.start();