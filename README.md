# Blitz Bidding

## Creators

Alejandra Altamirano, Josh Easley, and Chistian Tojot

## Description

The Live Auction Platform is an online marketplace designed to bring live auctions to a digital environment. It allows users to participate in real-time bidding, buy and sell collectibles, and interact with a community of collectors and enthusiasts. This platform offers a secure and convenient way to connect sellers and buyers, preserving the thrill of live auctions while providing the benefits of online accessibility.

## Features

**User Registration and Authentication:**

Users can create accounts, register, and log in to the platform securely using AWS Cognito.

**Item Submission:**

Registered users can submit items for auction, providing details, images, and starting prices. Admins review and approve items for auction.

**Live Auction Management:**

Admins can start, manage, and complete live auctions. The platform offers real-time updates on auction progress.

**Bidding:**

Users can participate in live auctions, place bids, and view auction status in real-time.

## User Stories

### As a User I want to be able to submit an item for auction.

**Feature Tasks:**

User can submit a message to AWS with details about their item for sale.

Item is stored in a review queue.

User receives confirmation/message that their item was successfully submitted.

**Acceptance Tests:**

Ensure that an item can be submitted and accurately show up in the review queue.

Ensure that user receives a success message if item is submitted, or error if not submitted.

Size: Medium

### As an Admin, I want to be able to approve or reject items for auction.

**Feature Tasks:**

Admin can view a list of potential auctions in the review queue

Admin can approve an item, which removes it from the review queue and adds it to the auction queue

If an item is rejected, or approved the status of the item is changed in the db to "approved", so user can see status update

**Acceptance Tests:**

Admin can view list of potential auctions in the review queue

Admin can pick an auction from the review queue and approve it, removing it from review and adding to auction queue

When item is approved or rejected, its status is updated in the db

Size: Medium

### As an Admin, I want to be able to start live auctions.

**Feature Tasks:**

Admin can pick an item from the auction queue and begin an auction

Auction goes live and countdown starts

When countdown is over, item is marked sold/not sold in the db

**Acceptance Tests:**

Admin can pick item from queue, start auction

Auction starts with countdown, and sends out updates to participants

When countdown ends, auction is marked sold/not sold

Size: Medium

### As an Admin, I want to be able to complete live auctions and declare who won the item.

**Feature Tasks:**

Admin can accept an offer and end an auction

Let all users know when auction has ended. Let winner (if any) know that they won the item.

**Acceptance Tests:**

Admin can accept an offer, auction ends

When auction ends, participants are notified

Winner receives notification they won

Item is marked as sold in db

Size: Medium

### As a User, I want to be able to join live auctions and make bids.

**Feature Tasks:**

User can subscribe to auction topic and see updates on auction progress

User can make bids

**Acceptance Tests:**

User is able to join auction and see updates

User bids can be accepted, and sent to admin/auctioneer

Size: Medium

### As a User, I want to be able to see lists of my auctions I've submitted and won.

**Feature Tasks:**

User can pull a list of their auctions from the db

**Acceptance Tests:**

User is able to query an endpoint, and either get a list of their auctions (listed, or won) or "no auctions listed" message

Size: Medium

## Domain Model

![Domain Model](./assets/domain-model.png)

## Database Model

![DB Model](./assets/database-model.png)

## References

ChatGPT , Jacob Knaack and AWS
