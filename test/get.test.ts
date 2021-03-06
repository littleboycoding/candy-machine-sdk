import { connection, getAccounts } from "solana-test-validator-js";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import candyMachineMock from "./mocks/candyMachineMock";

import { getAll, getMinted } from "../src/get";
import { createMintTransaction } from "../src/transactions";
import { expect } from "chai";

describe("get", function () {
  const MINT_PRICE = LAMPORTS_PER_SOL;
  const ITEM_AVAILABLE = 3;

  const accounts = getAccounts(2);
  const payer = accounts[0];

  let candyMachine: Keypair;

  this.timeout(60000);

  beforeEach(async function () {
    candyMachine = Keypair.generate();

    await candyMachineMock(
      connection,
      payer,
      candyMachine,
      payer.publicKey,
      payer.publicKey,
      {
        price: MINT_PRICE,
        itemsAvailable: ITEM_AVAILABLE,
      }
    );
  });

  describe("getAll", function () {
    it("should return all items", async function () {
      const items = await getAll(connection, candyMachine.publicKey);

      expect(items).to.be.an("array").and.have.lengthOf(ITEM_AVAILABLE);
      items.forEach((item) =>
        expect(item).to.be.an("object").and.have.all.keys("name", "uri")
      );
    });
  });
  describe("getMinted", function () {
    it("should return minted items", async function () {
      const mint = Keypair.generate();

      const transaction = await createMintTransaction(
        connection,
        payer.publicKey,
        candyMachine.publicKey,
        mint.publicKey
      );

      await sendAndConfirmTransaction(connection, transaction, [payer, mint]);

      const items = await getMinted(connection, candyMachine.publicKey);

      expect(items).to.be.an("array").and.have.lengthOf(1);
      expect(items[0]).to.be.an("object").and.have.all.keys("name", "uri");
    });
  });
  describe.skip("getUnminted", function () {
    it("should return unminted items", async function () {
      // const mint = Keypair.generate();
      // const transaction = await createMintTransaction(
      //   connection,
      //   payer.publicKey,
      //   candyMachine.publicKey,
      // mint.publicKey
      // );
      // await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
      // const items = await _getUnminted(connection, candyMachine.publicKey);
      // expect(items)
      //   .to.be.an("array")
      //   .and.have.lengthOf(ITEM_AVAILABLE - 1);
      // items.forEach((item) =>
      //   expect(item).to.be.an("object").and.have.all.keys("name", "uri")
      // );
    });
  });
});
