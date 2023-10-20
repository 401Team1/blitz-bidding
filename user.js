// 'use strict';

// const readline = require('readline');
// const AWS = require('aws-sdk');
// const WebSocket = require('ws');

// AWS.config.update({ region: 'us-west-2' });

// var credentials = new AWS.SharedIniFileCredentials({ profile: 'work-account' });
// AWS.config.credentials = credentials;

// const sns = new AWS.SNS();

// const topic = 'arn:aws:sns:us-west-2:067714926294:itemSubmission'; // Topic FIFO ARN for creating Item

// const rl = readline.createInterface({
// 	input: process.stdin,
// 	output: process.stdout,
// });

// const payload = {};

// function createPayload() {
// 	console.log('Welcome to Blitz Bidding! What would you like to do?');
// 	rl.question('Enter 1 to list an item or 2 to enter an auction: ', (choice) => {
// 		if (choice === '1') {
// 			listAnItem();
// 		} else if (choice === '2') {
// 			serverConnection();
// 		} else {
// 			console.log('Invalid choice. Please enter 1 or 2.');
// 			rl.close();
// 		}
// 	});
// }

// function listAnItem() {
// 	rl.question('Enter username: ', (createdBy) => {
// 		payload.createdBy = createdBy;
// 		rl.question('Enter item name: ', (itemName) => {
// 			payload.itemName = itemName;
// 			rl.question('Enter item category: ', (category) => {
// 				payload.category = category;
// 				rl.question('Enter item description: ', (description) => {
// 					payload.description = description;
// 					rl.question('Enter type of item: ', (itemType) => {
// 						payload.itemType = itemType;
// 						rl.close();

// 						const itemPayload = {
// 							createdBy: payload.createdBy,
// 							itemName: payload.itemName,
// 							category: payload.category,
// 							description: payload.description,
// 							itemType: payload.itemType,
// 						};

// 						const TopicMessage = {
// 							Subject: 'Item has been created',
// 							Message: JSON.stringify(itemPayload),
// 							TopicArn: topic,
// 						};

// 						sns.publish(TopicMessage).promise()
// 							.then(response => {
// 								console.log('Response from AWS Topic', response);
// 								// Only after the payload is created and sent to AWS, initiate WebSocket connection.
// 								serverConnection();
// 							})
// 							.catch(e => {
// 								console.log('Error Occurred on pub', e);
// 							});
// 					});
// 				});
// 			});
// 		});
// 	});
// }

// function serverConnection() {
// 	const ws = new WebSocket('wss://noderk8p63.execute-api.us-west-2.amazonaws.com/production');

// 	ws.on('open', function open() {
// 		console.log('User has connected to auction');
// 		ws.send(JSON.stringify({
// 			action: 'setName',
// 			name: payload.createdBy,
// 		}));
// 	});

// 	ws.on('message', function incoming(data) {
// 		const messageString = data.toString('utf8');
// 		console.log("Received:", messageString);
// 		const message = JSON.parse(messageString);

// 		if (message.action === 'startAuction') {
// 			userPrompt();
// 		}
// 	});

// 	ws.on('close', function close() {
// 		console.log('User has left the auction');
// 	});

// 	ws.on('error', function error(err) {
// 		console.log("Connection Error:", err.toString());	
// 	});
// }

// function userPrompt() {
// 	rl.question('Welcome to the auction room. Would you like to bid or send a message? (bid/message/none): ', (answer) => {
// 		answer = answer.toLowerCase();

// 		if (answer === 'bid') {
// 			rl.question('Enter your bid amount: ', (bidAmount) => {
// 				if (!isNaN(bidAmount)) {
// 					const amount = parseFloat(bidAmount);
// 					ws.send(JSON.stringify({
// 						action: 'setName',
// 						name: payload.createdBy,
// 					}));
// 					ws.send(JSON.stringify({
// 						action: 'placeBid',
// 						amount: amount,
// 					}));
// 				} else {
// 					console.log('Invalid bid amount. Please enter a number.');
// 					rl.close();
// 					ws.close();
// 				}
// 			});
// 		} else if (answer === 'message') {
// 			rl.question('Enter your message: ', (message) => {
// 				// Send the message to the server
// 				ws.send(JSON.stringify({
// 					action: 'sendMessage',
// 					message: message,
// 				}));
// 				rl.close();
// 				ws.close();
// 			});
// 		} else {
// 			rl.close();
// 			ws.close();
// 		}
// 	});
// }

// createPayload();

// module.exports = {
// 	serverConnection
// };

'use strict';

const readline = require('readline');
const AWS = require('aws-sdk');
const WebSocket = require('ws');

AWS.config.update({ region: 'us-west-2' });

var credentials = new AWS.SharedIniFileCredentials({ profile: 'work-account' });
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
  rl.question('Enter 1 to list an item or 2 to enter an auction: ', (choice) => {
    if (choice === '1') {
      listAnItem();
    } else if (choice === '2') {
      rl.question('Enter your username: ', (username) => {
        payload.username = username;
        serverConnection();
      });
    } else {
      console.log('Invalid choice. Please enter 1 or 2.');
      rl.close();
    }
  });
}

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

function serverConnection() {
  const ws = new WebSocket('wss://noderk8p63.execute-api.us-west-2.amazonaws.com/production');

  ws.on('open', function open() {
    console.log('User has connected to auction');
    ws.send(JSON.stringify({
      action: 'setName',
      name: payload.username,
    }));
  });

  ws.on('message', function incoming(data) {
    const messageString = data.toString('utf8');
    console.log("Received:", messageString);
    const message = JSON.parse(messageString);
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
  rl.question('Would you like to bid or send a message? (bid/message/none): ', (answer) => {
    answer = answer.toLowerCase();

    if (answer === 'bid') {
      rl.question('Enter your bid amount: ', (bidAmount) => {
        if (!isNaN(bidAmount)) {
          const amount = parseFloat(bidAmount);
          ws.send(JSON.stringify({
            action: 'bidAmount',
            bid: amount,
          }));
        } else {
          console.log('Invalid bid amount. Please enter a number.');
        }
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
    } else {
      rl.close();
    }
  });
}

createPayload();

module.exports = {
  serverConnection
};