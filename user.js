'use strict';

const readline = require('readline');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

var credentials = new AWS.SharedIniFileCredentials({ profile: 'work-account' });
AWS.config.credentials = credentials

const sns = new AWS.SNS();

const topic = 'arn:aws:sns:us-west-2:067714926294:itemSubmission'; // Topic FIFO ARN for creating Item

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const event = {};

rl.question('Enter category: ', (category) => {
    event.category = category;
    rl.question('Enter createdBy: ', (createdBy) => {
        event.createdBy = createdBy;
        rl.question('Enter description: ', (description) => {
            event.description = description;
            rl.question('Enter itemName: ', (itemName) => {
                event.itemName = itemName;
                rl.question('Enter itemType: ', (itemType) => {
                    event.itemType = itemType;

                    // Close the readline interface
                    rl.close();

                    // Create the itemPayload and TopicMessage
                    const itemPayload = {
                        category: event.category,
                        createdBy: event.createdBy,
                        description: event.description,
                        itemName: event.itemName,
                        itemType: event.itemType,
                    };

                    const TopicMessage = {
                        Subject: 'Item has been created',
                        Message: JSON.stringify(itemPayload),
                        TopicArn: topic,
                    };

                    // Publish the message to the SNS topic
                    sns.publish(TopicMessage).promise()
                        .then(response => {
                            console.log('Response from AWS Topic', response);
                        })
                        .catch(e => {
                            console.log('Error Occurred on pub', e);
                        });
                });
            });
        });
    });
});
