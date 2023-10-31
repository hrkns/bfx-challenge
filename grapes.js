"use strict";

const Grape = require("grenache-grape").Grape;

const announces = new Set();

// creating two grapes for emulating what's stated in the instructions
// it's using the same settings and all...

const grapesSettings = [
  {
    dht_port: 20001,
    dht_bootstrap: ["127.0.0.1:20002"],
    api_port: 30001,
  },
  {
    dht_port: 20002,
    dht_bootstrap: ["127.0.0.1:20001"],
    api_port: 40001,
  },
];

grapesSettings.map((settings, idx) => {
  const grape = new Grape(settings);

  grape.start();

  grape.on("ready", async () => {
    console.log(`Grape ${idx + 1} is ready`);
  });

  grape.on("listening", async () => {
    console.log(`Grape ${idx + 1} is listening`);
  });

  grape.on("peer", async (peer) => {
    console.log(`Grape ${idx + 1} discovered a peer`, peer);
  });

  grape.on("node", async () => {
    console.log(`Grape ${idx + 1} discovered a node`);
  });

  grape.on("warning", async (warning) => {
    console.log(`Grape ${idx + 1} issued a warning`, warning);
  });

  grape.on("announce", async (announce) => {
    // for avoiding logging the same announce over and over again
    if (announces.has(announce)) return;
    console.log(`Grape ${idx + 1} received announce "${announce}"`);
    announces.add(announce);
  });
});
