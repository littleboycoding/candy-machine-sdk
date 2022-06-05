# Candy machine SDK 🍭

This library provided simple & opinionated API to interact with on-chain metaplex's candy machine, The goal is to make it easiser to integrate candy machine with any web or app.

## Available API 📔

- mint - Mint token
- list - Show all NFT of candy machine

## Installation 📦

```sh
$ npm i candy-machine-sdk
```

## Examples 📚

```typescript
import { createMintTransaction } from "candy-machine-sdk/transactions";
import { getMinted, getAll, getUnminted } from "candy-machine-sdk/get";

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
const unmintedItems = await getUnminted(connection, CANDY_MACHINE_PUBLICKEY);
```

## Note ✏️

Getting data on-chain is expensive, I would recommend to use those getting items API from server, then cache those data and serve to client.
