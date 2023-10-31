"use strict";

class Orderbook {
  constructor() {
    // an order has the structure of { price: X, quantity: Y }
    this.buyOrders = [];
    this.sellOrders = [];
  }

  addOrder(order) {
    if (order.orderType === "buy") {
      this.buyOrders.push(order);
    } else {
      this.sellOrders.push(order);
    }

    // TODO: after adding the order, we should run the simple order matching engine logic
    // if any remainder is created, we should return a signal that indicates to the caller of the
    // addOrder method that the order was not fully filled and hence new orders were created
    // so the called should broadcast the new orders to the network
  }
}

module.exports = Orderbook;
