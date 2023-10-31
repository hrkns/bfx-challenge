# BFX Challenge

This repository contains a solution for the BFX challenge. It demonstrates a system where orders are processed and communications between servers are logged, including when a new order is received or when order remainders are created.

## Prerequisites

Ensure that you have [Node.js](https://nodejs.org/) installed on your system.

## Getting Started

1. **Setup**: Install the necessary dependencies by running:
   ```bash
   npm install
   ```

2. **Start the Grape Network**:
   - Begin the grapes by executing:
     ```bash
     node grapes.js
     ```

3. **Launch Servers**:
   - You can start multiple server instances. For each instance, open a new terminal and run:
     ```bash
     node server.js
     ```

4. **Demo Run**:
   - To see the system in action, execute the client demo with:
     ```bash
     node client.js
     ```
   - Within this demo, multiple orders are processed. Observe the server logs to understand the flow of communications as orders are received and remainders are managed.

## Observations

- Each time an order is processed, you'll notice logs across the servers detailing the order communications.
- Watch for specific logs indicating order receipt and the creation of remainders.
