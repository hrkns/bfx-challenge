"use strict";

const { PeerRPCClient } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");

const link = new Link({
  grape: "http://127.0.0.1:30001",
});
link.start();

const peer = new PeerRPCClient(link, {});
peer.init();

function peerRequest(peer, key, data, opts) {
  return new Promise((resolve, reject) => {
    peer.request(key, data, opts, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

async function main() {
  try {
    const orders = [
      { orderType: "buy", quantity: 2, price: 10 },
      { orderType: "sell", quantity: 1, price: 15 },
      { orderType: "buy", quantity: 5, price: 8 },
      { orderType: "sell", quantity: 3, price: 9 },
      // Add more orders as needed
    ];

    for (let order of orders) {
      const data = await peerRequest(peer, "orderbook", order, { timeout: 10000 });
      console.log("Successfully processed order:", order);
      console.log("Received response:", data);
    }
    
  } catch (err) {
    console.error("Error receiving response from server:", err);
  }
}

main().finally(() => {
  process.exit(1);
});
