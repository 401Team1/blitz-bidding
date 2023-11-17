import { createStore, combineReducers } from 'redux';

import auctionReducer from './Auction';


const reducer = combineReducers({ 
    auction: auctionReducer,
});

export default createStore(reducer);