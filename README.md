# Candy machine SDK 🍭

This library provided simple & opinionated API to interact with on-chain metaplex's candy machine, The goal is to make it easiser to integrate candy machine with any web or app.

Compatible with both Node.js or web browser environment 🌍.

## Available API 📔

- Minting token
- Getting list of token from Candy machine

## Installation 📦

```sh
$ npm i candy-machine-sdk @solana/web3.js
```

## Examples 📚

### Minting

```typescript
import { Keypair, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import { createMintTransaction, getMinted, getAll } from "candy-machine-sdk";

const connection = new Connection();
const mint = Keypair.generate();

const transaction = await createMintTransaction(
  connection,
  PAYER_PUBLICKEY,
  CANDY_MACHINE_PUBLICKEY,
  mint.publickey
);

await sendAndConfirmTransaction(transaction, [PAYER_PUBLICKEY, mint]);

const allItems = await getAll(connection, CANDY_MACHINE_PUBLICKEY);
const mintedItems = await getMinted(connection, CANDY_MACHINE_PUBLICKEY);
```

### Getting token

```typescript
import { Keypair, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import { getMinted, getAll } from "candy-machine-sdk";

const connection = new Connection();

const allItems = await getAll(connection, CANDY_MACHINE_PUBLICKEY);
const mintedItems = await getMinted(connection, CANDY_MACHINE_PUBLICKEY);
```

## Note ✏️

Getting data on-chain is expensive, I would recommend to use those getting items API from server, then cache those data and serve to client.
