const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-2' });
const sns = new AWS.SNS();

const params = {
  TopicArn: 'arn:aws:sns:us-west-2:783478094927:item-submission.fifo',
  Message: JSON.stringify(itemData),
};

sns.publish(params, (err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Message published to SNS:', data);
  }
});
