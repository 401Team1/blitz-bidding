'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const sns = new AWS.SNS();

const topic = ''; // Topic FIFO ARN for creating Item

const itemPayload = {
    category : event.category,
    createdBy: event.createdBy,
    description: event.description,
    itemName: event.itemName,
    itemType: event.itemType,
}

const TopicMessage = {
    Subject: 'Item has been created',
    Messge: JSON.stringify(itemPayload),
    TopicArn: topic,
    MessageGroupId: 'create-item'
}

sns.publish(TopicMessage).promise()
    .then(response => {
        console.log('Response from AWS Topic', response);
    })
    .catch(e => {
        console.log('Error Occurred on pub', e)
    })