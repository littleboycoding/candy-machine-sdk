# Candy machine SDK 🍭

This library provided simple & opinionated API to interact with on-chain metaplex's candy machine, The goal is to make it easiser to integrate candy machine with any web or app.

Compatible with both Node.js or web browser environment 🌍.

## Available API 📔

- mint - Mint token
- list - Show all NFT of candy machine

## Installation 📦

```sh
$ npm i candy-machine-sdk @solana/web3.js
```

## Examples 📚

```typescript
import { createMintTransaction, getMinted, getAll } from "candy-machine-sdk";

// Minting
const transaction = await createMintTransaction(
  connection,
  PAYER_PUBLICKEY,
  MINT_PUBLICKEY,
  CANDY_MACHINE_PUBLICKEY
);

// Get list of token
const allItems = await getAll(connection, CANDY_MACHINE_PUBLICKEY);
const mintedItems = await getMinted(connection, CANDY_MACHINE_PUBLICKEY);
```

## Note ✏️

Getting data on-chain is expensive, I would recommend to use those getting items API from server, then cache those data and serve to client.
