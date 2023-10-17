'use strict';

var credentials = new AWS.SharedIniFileCredentials({profile: 'work-account'});
AWS.config.credentials = credentials

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const sns = new AWS.SNS();

const topic = 'aws:sns:us-west-2:067714926294:itemSubmission'; // Topic FIFO ARN for creating Item

const itemPayload = {
    category : category,
    createdBy: createdBy,
    description: description,
    itemName: itemName,
    itemType: itemType,
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