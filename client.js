const { PeerRPCClient } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");

const link = new Link({
  grape: "http://127.0.0.1:40001",
});
link.start();

const peer = new PeerRPCClient(link, {});
peer.init();

async function main() {
  return new Promise(async (resolve, reject) => {
    const orderType = "buy";
    const quantity = 2;
    const price = 10;

    peer.request(
      "orderbook",
      {
        orderType,
        quantity,
        price,
      },
      { timeout: 10000 },
      (err, data) => {
        console.log(
          `Receiving ${err ? "error" : "success"} response from server...`,
          err || data
        );
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}

main().finally(() => {
  process.exit(1);
});
