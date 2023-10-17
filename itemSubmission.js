const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-2' });
const sns = new AWS.SNS();

const params = {
  TopicArn: 'arn:aws:sns:us-west-2:067714926294:itemSubmission',
  Message: JSON.stringify(itemData),
};

sns.publish(params, (err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Message published to SNS:', data);
  }
});
