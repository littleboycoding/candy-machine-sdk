import { PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID } from "@metaplex-foundation/mpl-candy-machine";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Cleanup, startSolanaTestValidator } from "solana-test-validator-js";
import { getAssociatedTokenAddress, getMint } from "@solana/spl-token";

import { createMintTransaction } from "../src/transactions";

import candyMachineMock from "./mocks/candyMachineMock";
import { expect } from "chai";

describe("instructions", function () {
  const MINT_PRICE = LAMPORTS_PER_SOL;
  const ITEM_AVAILABLE = 1;

  let connection: Connection;
  let seller: Keypair;
  let buyer: Keypair;
  let candyMachine: Keypair;
  let cleanup: Cleanup;

  this.timeout(60000);

  before(async function () {
    [connection, [seller, buyer], cleanup] = await startSolanaTestValidator(
      [
        "--bpf-program",
        CANDY_MACHINE_PROGRAM_ID,
        "test/mocks/mpl/candy_machine.so",
        "--bpf-program",
        TOKEN_METADATA_PROGRAM_ID,
        "test/mocks/mpl/token_metadata.so",
      ],
      {
        accounts: {
          number: 2,
          lamports: LAMPORTS_PER_SOL * 10000,
        },
      }
    );
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

  after(function () {
    cleanup();
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
        buyer,
        mint,
        candyMachine.publicKey,
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
