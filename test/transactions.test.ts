import {
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { connection, getAccounts } from "solana-test-validator-js";
import { getAssociatedTokenAddress, getMint } from "@solana/spl-token";

import { createMintTransaction } from "../src/transactions";

import candyMachineMock from "./mocks/candyMachineMock";
import { expect } from "chai";

import puppeteer, { Browser } from "puppeteer";

describe("instructions", function () {
  const MINT_PRICE = LAMPORTS_PER_SOL;
  const ITEM_AVAILABLE = 1;

  const accounts = getAccounts(2);
  const seller = accounts[0];
  const buyer = accounts[1];

  let browser: Browser;

  let candyMachine: Keypair;

  this.timeout(60000);

  before(async function () {
    browser = await puppeteer.launch();
  });

  beforeEach(async function () {
    candyMachine = Keypair.generate();

    await candyMachineMock(
      connection,
      seller,
      candyMachine,
      seller.publicKey,
      seller.publicKey,
      {
        price: MINT_PRICE,
        itemsAvailable: ITEM_AVAILABLE,
      }
    );
  });

  describe("createMintInstruction", function () {
    it("should be able to mint", async function () {
      const mint = Keypair.generate();

      const startingLamports = await connection
        .getAccountInfo(buyer.publicKey)
        .then((acc) => {
          if (!acc) throw new Error("no account");
          return acc.lamports;
        });

      const transaction = await createMintTransaction(
        connection,
        buyer.publicKey,
        mint.publicKey,
        candyMachine.publicKey
      );

      await sendAndConfirmTransaction(connection, transaction, [buyer, mint]);

      const mintAccount = await getMint(connection, mint.publicKey);
      const owner = await connection
        .getTokenLargestAccounts(mint.publicKey)
        .then((res) => res.value[0]);
      const buyerWallet = await getAssociatedTokenAddress(
        mint.publicKey,
        buyer.publicKey
      );

      const remainingLamports = await connection
        .getAccountInfo(buyer.publicKey)
        .then((acc) => {
          if (!acc) throw new Error("no account");
          return acc.lamports;
        });

      expect(mintAccount.decimals).equal(0);
      expect(mintAccount.supply).equal(BigInt(1));
      expect(owner.address.toBase58()).equal(buyerWallet.toBase58());
      expect(remainingLamports).lessThanOrEqual(startingLamports - MINT_PRICE);
    });
  });
});
