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

// TODO: no race conditions are being handled in the algorithm

service.on("request", (rid, key, payload, handler) => {
  payload = payload.v ? JSON.parse(payload.v) : payload;

  if (payload.type === "submitOrder") {
    console.log("An order has been submitted", { rid, key, payload });
    if (payload.broadcast) {
      console.log("Receiving order as broadcast so not broadcasting again...");
      console.log("Instead, adding order to local instance of orderbook...");
      orderbook.addOrder(payload.data);
      // not putting this handler reply here made me lose a lot of time as I was getting a timeout error when trying to broadcast from the original server
      handler.reply(null, {});
    } else {
      const shouldBroadcastOrderbook = orderbook.addOrder(payload.data);
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
          // if the orderbook has been modified, broadcast the new orderbook, otherwise only broadcast the new order
          const dataToSend = shouldBroadcastOrderbook
            ? {
                // TODO: detecting if the orderbook has been modified should be done in a better way
                // instead of sending the whole orderbook, only send data indicating
                // which orders have been completely fulfilled
                // which orders have been partially fulfilled
                // which orders have been added
                // for the above aoperations, we would need to somehow identify the orders using IDs mechanisms
                type: "broadcastOrderbook",
                data: orderbook.getOrders(),
              }
            : payload;
          client.request(
            serverId,
            {
              v: JSON.stringify({
                ...dataToSend,
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
        link.put({ v: JSON.stringify(payload.data) }, (err, hash) => {
          if (err) {
            console.error("Error storing order:", err);
            handler.reply(err);
            return;
          }
          console.log("Order stored with hash:", hash);
          handler.reply(null, { hash });
        });
      });
    }
  } else if (payload.type === "broadcastOrderbook") {
    console.log("Received orderbook broadcast", { rid, key, payload });
    orderbook.setOrders(payload.data);
    handler.reply(null, {});
  } else {
    handler.reply({ err: "Unknown request type" });
  }
});
