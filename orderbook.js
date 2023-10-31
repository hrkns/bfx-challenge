"use strict";

function arraysAreEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
      return false;
    }
  }

  return true;
}

class Orderbook {
  constructor() {
    // an order has the structure of { price: X, quantity: Y }
    this.orders = [];
  }

  getOrders() {
    return this.orders;
  }

  setOrders(orders) {
    this.orders = orders;
  }

  addOrder(order) {
    let broadcastModifiedOrders = false;
    const ordersBck = JSON.parse(JSON.stringify(this.orders));
    this._matchOrder(order);
    broadcastModifiedOrders = !arraysAreEqual(this.orders, ordersBck);
    // if not all orders were matched, add the remaining ones to the orders array
    if (order.quantity > 0) {
      this.orders.push(order);
    }
    // returning this flag as true indicates that the orderbook has been modified and needs to be broadcasted
    return broadcastModifiedOrders;
  }

  _matchOrder(order) {
    // looping through the opposite orders and comparing them with the order being added to the orderbook
    let i = 0;
    // the order will be matched with the opposite orders until either the order quantity is 0 or there are no more opposite orders
    while (i < this.orders.length && order.quantity > 0) {
      if (this.orders[i].orderType !== order.orderType) {
        const oppositeOrder = this.orders[i];

        if (
          // if the order is a buy order, it will be matched with a sell order with a lower price
          (order.orderType === "buy" && order.price >= oppositeOrder.price) ||
          // if the order is a sell order, it will be matched with a buy order with a higher price
          (order.orderType === "sell" && order.price <= oppositeOrder.price)
        ) {
          if (order.quantity < oppositeOrder.quantity) {
            oppositeOrder.quantity -= order.quantity;
            order.quantity = 0;
          } else {
            // if the order quantity is greater than the opposite order quantity, the opposite order will be removed from the orderbook
            order.quantity -= oppositeOrder.quantity;
            this.orders.splice(i, 1);
            // Adjust index due to splice
            i--;
          }
        }
      }

      i++;
    }
  }
}

module.exports = Orderbook;
