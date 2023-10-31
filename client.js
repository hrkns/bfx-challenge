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
    const data = await peerRequest(
      peer,
      "orderbook",
      {
        orderType: "buy",
        quantity: 2,
        price: 10,
      },
      { timeout: 10000 }
    );

    console.log("Successfully received response from server:", data);
  } catch (err) {
    console.error("Error receiving response from server:", err);
  }
}

main().finally(() => {
  process.exit(1);
});
