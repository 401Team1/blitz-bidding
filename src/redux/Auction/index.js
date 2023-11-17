'use strict';


/*
currentItem - { 
	id: string, 
	name: string, 
	description: string,
	picture: base64 image data/string 
	seller: string, 
	reserve: int }

maxBid - int

auctionStarted - date/time

messages - [{ time: <date/time>, user: string, 
message: string}]

nextItem - { 
	id: string, 
	name: string, 
	description: string,
	picture: base64 image data/string 
	seller: string, 
	reserve: int }
*/

// Reducer Actions
/*
    get_messages  // will pull messages from api, update state
    start_auction // will set up currentItem and start time
    end_auction // send out messages to winner
    send_message // send message to server, add to state/messages
    send_bid // send bid to server, update maxBid in state
*/

const initialState = {
  currentItem: { id:'aabbccdd112233',
                 name: 'SUPER RARE POKEMON CARD',
                 description: "It's super rare..",
                 picture: '',
                 seller: 'SomeUser123',
                 reserve: 1500 },
  maxBid: 2000,
  auctionStarted: Date.now(),
  messages: [{ timestamp: '11/17/23 11:00:00 AM',
               user: 'SomeUser123',
               message: 'This is a test message'}],

  nextItem: { id:'aabbccdd223344',
              name: 'Signed copy of Twilight',
              description: "Signed by those actors in it",
              picture: '',
              seller: 'SomeUser123',
              reserve: 1500 },
}

function reducer(state = initialState, action) {
  const { type, payload } =  action;

  switch(type) {
    case 'ADD_TO_CART':
      return {
        ...state,
        itemCount: state.itemCount + 1,
        contents: [ ...state.contents, { name: payload }],
      }
    case 'start_auction':
        let auctionStartMessage = {
            timestamp: Date.now(),
            user: 'System',
            message: 'Auction has started.'
        }
        let updateMessages = [...state.messages, auctionStartMessage ];
        return {
            ...state,
            auctionStarted: Date.now(),
            messages: updateMessages
        }
    case 'end_auction':
        let auctionEndMessage = {
            timestamp: Date.now(),
            user: 'System',
            message: 'Auction has ended.'
        }
        return {
            ...state,
            auctionStarted = null,
            messages: [ ...state.messages, auctionEndMessage ]
        }
    case 'send_message':
        let newMessage = {
            username: payload.username,
            message: payload.message,
            timestamp: Date.now()
        }
        return {
            ...state,
            messages: [...state.messages, newMessage ]
        }
    case 'send_bid':
        let bidMessage = {
            timestamp: Date.now(),
            user: 'System',
            message: `Bid recieved for $${payload.bidAmount}`
        }
        return {
            ...state,
            maxBid: state.maxBid + payload.bidAmount,
            messages: [...state.messages, bidMessage ]
        }
    default:
      return state;
  }
}

// actions / action creator => a function that returns an action object
export const startAuction = (item) => {
  return {
    type: 'start_auction',
    payload: item
  }
}

export const endAuction = (item) => {
    return {
      type: 'end_auction',
      payload: item
    }
  }

export const sendMessage = (item) => {
    return {
            type: 'send_message',
            payload: item
        }
}

export const sendBid = (item) => {
    return {
            type: 'send_bid',
            payload: item
        }
}


export default reducer;