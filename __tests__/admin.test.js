const admin = require('../admin');

describe("Admin Module Tests", () => {

    test("handleWebSocketMessage adds bid to bids array", () => {
        const message = {
            type: 'bid',
            bid: {
                bidder: 'user1',
                amount: 100
            }
        };
        admin.handleWebSocketMessage(message);
        expect(admin._test_bids).toEqual([message.bid]);
    });

    test("handleWebSocketMessage doesn't add non-bid to bids array", () => {
        const message = {
            type: 'message',
            content: 'Hello'
        };
        admin.handleWebSocketMessage(message);
        expect(admin._test_bids).toEqual([]);
    });

    test("isItemFilledOut returns false for an item with empty values", () => {
        const item = {
            createdBy: "user1",
            itemName: "",
            category: "cat1",
            description: "desc1",
            itemType: "type1"
        };
        expect(admin.isItemFilledOut(item)).toBe(false);
    });

    test("isItemFilledOut returns false for an item with whitespace values", () => {
        const item = {
            createdBy: "user1",
            itemName: "    ",
            category: "cat1",
            description: "desc1",
            itemType: "type1"
        };
        expect(admin.isItemFilledOut(item)).toBe(false);
    });

    test("isItemFilledOut returns false for an item with values starting with 'Enter'", () => {
        const item = {
            createdBy: "user1",
            itemName: "Enter item name",
            category: "cat1",
            description: "desc1",
            itemType: "type1"
        };
        expect(admin.isItemFilledOut(item)).toBe(false);
    });

});

