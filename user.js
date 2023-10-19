'use strict';

const readline = require('readline');
const http = require('http');
const socketIO = require('socket.io'); // Import the socket.io library  
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

rl.question('Enter item category: ', (category) => {
    event.category = category;
    rl.question('Enter your e-mail: ', (createdBy) => {
        event.createdBy = createdBy;
        rl.question('Enter item description: ', (description) => {
            event.description = description;
            rl.question('Enter item name: ', (itemName) => {
                event.itemName = itemName;
                rl.question('Enter type of item: ', (itemType) => {
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

const server = http.createServer((req, res) => {
    // Your REST API request handling logic here
    // ...
});

const io = socketIO(server); // Create a socket.io server

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');

    // User Authentication: Collect and store the username
    socket.on('login', (username) => {
        socket.username = username;
        socket.emit('loginSuccess', username);
    });

    // Room Management: Join a room
    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        // Send room details to the user
        socket.emit('roomDetails', rooms.get(roomName));
    });

    // Prompt for Messages
    socket.on('sendMessage', (message, roomName) => {
        const messageData = { username: socket.username, message };
        io.to(roomName).emit('newMessage', messageData);
    });

    // Prompt for Bids
    socket.on('submitBid', (bidAmount, roomName) => {
        const bidId = generateRandomId(); // Generate a random bid identifier
        const bidData = { username: socket.username, bidId, bidAmount };
        io.to(roomName).emit('newBid', bidData);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const port = 3001; 
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Helper function to generate a random bid identifier
function generateRandomId() {
    return Math.random().toString(36).substring(7);
}

module.exports = 