"use strict";

const { PeerRPCServer, PeerRPCClient } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");
const Orderbook = require("./orderbook.js");

console.log("Creating link...");
const link = new Link({
  grape: "http://127.0.0.1:30001",
});
console.log("Starting link...");
link.start();

console.log("Creating peer...");
const peer = new PeerRPCServer(link, {
  timeout: 300000,
});
console.log("Starting peer...");
peer.init();

console.log("Creating service...");
// the port is randomly generated so that multiple servers can run on the same machine
const port = 1024 + Math.floor(Math.random() * 1000);
const service = peer.transport("server");
console.log(`Service listening on port ${port}`);
service.listen(port);

// all servers will be announced with the same id
const serverId = "orderbook";
setTimeout(() => {
  link.announce(serverId, service.port, {});
}, 1000);

// local instances of orderbook, in theory all the servers should have the same orderbook
// except for the intervals where the orderbook is being updated and the new data is being broadcasted
const orderbook = new Orderbook();

console.log('Registering service event "request"...');

service.on("request", (rid, key, payload, handler) => {
  payload = payload.v ? JSON.parse(payload.v) : payload;
  console.log("An order has been submitted", { rid, key, payload });

  if (payload.broadcast) {
    console.log("Receiving order as broadcast so not broadcasting again...");
    console.log("Instead, adding order to local instance of orderbook...");
    orderbook.addOrder(payload);
    // not putting this handler reply here made me lose a lot of time as I was getting a timeout error when trying to broadcast from the original server
    handler.reply(null, {});
  } else {
    console.log("Broadcasting order to peers...");
    link.lookup(serverId, (err, peers) => {
      if (err) {
        console.error("Error looking up peers:", err);
        return;
      }

      console.log("Found peers:", peers);
      peers.forEach((peer) => {
        // Don't broadcast to itself, otherwise it will broadcast to itself again and again and again...
        const [host, port] = peer.split(":");
        if (port === String(service.port)) {
          console.log("Not broadcasting to self");
          return;
        }

        console.log(`Broadcasting to peer ${peer}...`);
        // specify target peer
        const client = new PeerRPCClient(link, { peer: { host, port } });
        client.init();
        client.request(
          serverId,
          {
            v: JSON.stringify({
              ...payload,
              // Set broadcast to true so that the target peer knows to not broadcast again
              broadcast: true,
            }),
          },
          { timeout: 5000 },
          (err, data) => {
            if (err) {
              console.error("Error broadcasting order to peer:", {
                peer,
                err,
              });
            } else {
              console.log("Successfully broadcasted order to peer", {
                peer,
                data,
              });
            }
          }
        );
      });

      console.log("Storing order in DHT...");
      link.put({ v: JSON.stringify(payload) }, (err, hash) => {
        if (err) {
          console.error("Error storing order:", err);
          handler.reply(err);
          return;
        }
        orderbook.addOrder(payload);
        console.log("Order stored with hash:", hash);
        handler.reply(null, { hash });
      });
    });
  }
});
