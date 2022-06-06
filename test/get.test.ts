import { PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID } from "@metaplex-foundation/mpl-candy-machine";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { Cleanup, startSolanaTestValidator } from "solana-test-validator-js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import candyMachineMock from "./mocks/candyMachineMock";

import { getAll, getMinted, getUnminted } from "../src/get";
import { createMintTransaction } from "../src/transactions";
import { expect } from "chai";

describe("get", function () {
  const MINT_PRICE = LAMPORTS_PER_SOL;
  const ITEM_AVAILABLE = 3;

  let connection: Connection;
  let cleanup: Cleanup;
  let payer: Keypair;
  let candyMachine: Keypair;

  this.timeout(60000);

  before(async function () {
    [connection, [payer], cleanup] = await startSolanaTestValidator([
      "--bpf-program",
      CANDY_MACHINE_PROGRAM_ID,
      "test/mocks/mpl/candy_machine.so",
      "--bpf-program",
      TOKEN_METADATA_PROGRAM_ID,
      "test/mocks/mpl/token_metadata.so",
    ]);
  });

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

  after(function () {
    cleanup();
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
        mint.publicKey,
        candyMachine.publicKey
      );

      await sendAndConfirmTransaction(connection, transaction, [payer, mint]);

      const items = await getMinted(connection, candyMachine.publicKey);

      expect(items).to.be.an("array").and.have.lengthOf(1);
      expect(items[0])
        .to.be.an("object")
        .and.have.all.keys("name", "uri", "metadata");
      expect(items[0].metadata?.mint.toBase58()).to.equal(
        mint.publicKey.toBase58()
      );
    });
  });
  describe.skip("getUnminted", function () {
    it("should return unminted items", async function () {
      const mint = Keypair.generate();

      const transaction = await createMintTransaction(
        connection,
        payer.publicKey,
        mint.publicKey,
        candyMachine.publicKey
      );

      await sendAndConfirmTransaction(connection, transaction, [payer, mint]);

      const items = await getUnminted(connection, candyMachine.publicKey);

      expect(items)
        .to.be.an("array")
        .and.have.lengthOf(ITEM_AVAILABLE - 1);
      items.forEach((item) =>
        expect(item).to.be.an("object").and.have.all.keys("name", "uri")
      );
    });
  });
});
