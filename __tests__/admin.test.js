// Mocking the 'ws' module
jest.mock('ws', () => {
    class WebSocket {
        constructor() {
            this.on = jest.fn();
            this.send = jest.fn();
        }
    }
    return WebSocket;
});

const admin = require('../admin');

describe('Admin Module Tests', () => {

    beforeEach(() => {
        // Reset the bids array before each test for isolation
        admin._test_bids = [];
    });

    test('handleWebSocketMessage doesn\'t add non-bid to bids array', () => {
        const message = {
            type: 'non-bid',
            bid: {
                bidder: 'user1',
                amount: 100
            }
        };
        admin.handleWebSocketMessage(message);
        expect(admin._test_bids).toEqual([]);
    });

    test('isItemFilledOut returns true for a fully filled out item', () => {
        const item = {
            createdBy: 'admin1',
            itemName: 'Test Item',
            category: 'Electronics',
            description: 'This is a test item for auction.',
            itemType: 'Auction'
        };
        expect(admin.isItemFilledOut(item)).toBe(true);
    });

    test('isItemFilledOut returns false for an item with missing values', () => {
        const item = {
            createdBy: 'admin1',
            category: 'Electronics',
            description: 'This is a test item for auction.',
            itemType: 'Auction'
        };
        expect(admin.isItemFilledOut(item)).toBe(false);
    });

    test('isItemFilledOut returns false for an item with empty values', () => {
        const item = {
            createdBy: 'admin1',
            itemName: '',
            category: 'Electronics',
            description: '  ',
            itemType: 'Auction'
        };
        expect(admin.isItemFilledOut(item)).toBe(false);
    });
});


