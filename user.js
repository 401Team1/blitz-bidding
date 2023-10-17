'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

var credentials = new AWS.SharedIniFileCredentials({ profile: 'work-account' });
AWS.config.credentials = credentials

const sns = new AWS.SNS();

const topic = 'arn:aws:sns:us-west-2:067714926294:itemSubmission'; // Topic FIFO ARN for creating Item

const event = {
    category: 'Enter category: ',
    createdBy: 'Enter createdBy: ',
    description: 'Enter description: ',
    itemName: 'Enter itemName: ',
    itemType: 'Enter itemType: ',
};

const itemPayload = {
    category: event.category,
    createdBy: event.createdBy,
    description: event.description,
    itemName: event.titemName,
    itemType: event.itemType,
}

const TopicMessage = {
    Subject: 'Item has been created',
    Message: JSON.stringify(itemPayload),
    TopicArn: topic,
    // MessageGroupId: 'create-item'
}

sns.publish(TopicMessage).promise()
    .then(response => {
        console.log('Response from AWS Topic', response);
    })
    .catch(e => {
        console.log('Error Occurred on pub', e)
    })
