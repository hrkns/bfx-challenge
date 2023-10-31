# BFX Challenge

This repository contains a solution for the BFX challenge. It demonstrates a system where orders are processed and communications between servers are logged, including when a new order is received or when order remainders are created.

## Prerequisites

[Node.js](https://nodejs.org/) must installed on the system.

## Getting Started

1. **Setup**: Required dependencies are installed by running:
   ```bash
   npm install
   ```

2. **Start the Grape Network**:
   - We being the grapes by executing:
     ```bash
     node grapes.js
     ```

3. **Launch Servers**:
   - We can start multiple server instances. For each instance, let's open a new terminal and run:
     ```bash
     node server.js
     ```

4. **Demo Run**:
   - To see the system in action, let's execute the client demo with:
     ```bash
     node client.js
     ```
   - In this demo, multiple hardcoded orders are processed. By watching the server logs we can understand the flow of communications as orders are received and remainders are managed.

## Observations

- Each time an order is processed, we'll notice logs across the servers detailing the order communications.
- We can watch for specific logs indicating orders being received and the creation of remainders.
