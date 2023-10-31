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
const port = 1024 + Math.floor(Math.random() * 1000);
const service = peer.transport("server");
console.log("Starting service on port", port, "...");
service.listen(port);

const serverId = "orderbook";
link.announce(serverId, service.port, {});

const orderbook = new Orderbook();

console.log('Registering service event "request"...');
service.on("request", (rid, key, payload, handler) => {
  payload = payload.v ? JSON.parse(payload.v) : payload;
  console.log("An order has been submitted", { rid, key, payload });

  if (payload.broadcast) {
    console.log("Receiving order as broadcast so not broadcasting again...");
    console.log("Instead, adding order to local instance of orderbook...");
    orderbook.addOrder(payload);
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
        // Don't broadcast to itself
        const ip = peer.split(":")[0];
        const port = peer.split(":")[1];
        if (port === String(service.port)) {
          console.log("Not broadcasting to self");
          return;
        }

        console.log('Broadcasting to peer "' + peer + '"...');
        const client = new PeerRPCClient(link, { peer: { host: ip, port } });
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
                ip,
                port,
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
