'use strict';

const readline = require('readline');
const AWS = require('aws-sdk');
const WebSocket = require('ws');

AWS.config.update({ region: 'us-west-2' });

var credentials = new AWS.SharedIniFileCredentials({ profile: 'work-profile' }); // make sure this profile is right
AWS.config.credentials = credentials;

const sns = new AWS.SNS();

const topic = 'arn:aws:sns:us-west-2:067714926294:itemSubmission'; // Topic FIFO ARN for creating Item

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const payload = {};

function createPayload() {
  console.log('Welcome to Blitz Bidding! What would you like to do?');
  rl.question('Enter 1 to review pending auctions or 2 to enter auction: ', (choice) => {
    if (choice === '1') {
      listAnItem();
    } else if (choice === '2') {
      //rl.question('Enter your username: ', (username) => {
        //payload.username = username;
        serverConnection();
      //});
    } else {
      console.log('Invalid choice. Please enter 1 or 2.');
      rl.close();
    }
  });
}
/*
function listAnItem() {
  rl.question('Enter username: ', (createdBy) => {
    payload.createdBy = createdBy;
    rl.question('Enter item name: ', (itemName) => {
      payload.itemName = itemName;
      rl.question('Enter item category: ', (category) => {
        payload.category = category;
        rl.question('Enter item description: ', (description) => {
          payload.description = description;
          rl.question('Enter type of item: ', (itemType) => {
            payload.itemType = itemType;
            rl.close();

            const itemPayload = {
              createdBy: payload.createdBy,
              itemName: payload.itemName,
              category: payload.category,
              description: payload.description,
              itemType: payload.itemType,
            };

            const TopicMessage = {
              Subject: 'Item has been created',
              Message: JSON.stringify(itemPayload),
              TopicArn: topic,
            };

            sns.publish(TopicMessage).promise()
              .then(response => {
                console.log('Response from AWS Topic', response);
                // No WebSocket connection when listing an item
                // You can add additional logic here if needed
              })
              .catch(e => {
                console.log('Error Occurred on pub', e);
              });
          });
        });
      });
    });
  });
}
*/

function serverConnection() {
  const ws = new WebSocket('wss://noderk8p63.execute-api.us-west-2.amazonaws.com/production');

  ws.on('open', function open() {
    //console.log('Admin has connected to auction');
    ws.send(JSON.stringify({
      action: 'setName',
      name: 'admin',
    }));
  });

  ws.on('message', function incoming(data) {
    const msgString = data.toString('utf-8')
    const msgJson = JSON.parse(msgString);
    if ( msgJson.systemMessage ) {
        console.log('\n' + '[system]:', msgJson.systemMessage);
    }
    if ( msgJson.publicMessage ) {
        console.log('\n' + msgJson.publicMessage);
    }
    if ( msgJson.privateMessage ) {
        console.log('\n**Private Message** ' + msgJson.privateMessage);
    }
	userPrompt(ws);
  });

  ws.on('close', function close() {
    console.log('User has left the auction');
  });

  ws.on('error', function error(err) {
    console.log("Connection Error:", err.toString());
  });
}

function userPrompt(ws) {
  rl.question('Start auction/Message/End Auction (start/message/end): ', (answer) => {
    answer = answer.toLowerCase();

    if (answer === 'start') {
        const testAuction = {
            category: "Pretty rare items",
            itemName: "Rare Item",
            description: "A Super Rare Item",
            itemType: "Rare Thing"
        }
        rl.question('Press "enter" to begin auction', (e) => {
          ws.send(JSON.stringify({
            "action": 'startAuction',
            "auctionItem": testAuction,
          }));
        // rl.close();
      });
    } else if (answer === 'message') {
      rl.question('Enter your message: ', (message) => {
        // Send the message to the server
        ws.send(JSON.stringify({
          action: 'sendPublic',
          message: message,
        }));
        // rl.close();
      });
    } else if ( answer === 'end' ) {
      rl.close();
    }
  });
}

createPayload();