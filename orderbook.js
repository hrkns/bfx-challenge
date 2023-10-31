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
  }
}

module.exports = Orderbook;
