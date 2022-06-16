import { Inspector, Unmintable } from "../src/inspector";
import { connection, getAccounts } from "solana-test-validator-js";
import candyMachineMock from "./mocks/candyMachineMock";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { assert } from "chai";
import { CandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import BN from "bn.js";
import { createMintTransaction } from "../src/transactions";

describe("inspector", function () {
  const accounts = getAccounts(3);
  const available = new BN(1);

  let candyMachine: Keypair;
  let candyMachineInspector: Inspector;
  let liveDate: BN;

  this.timeout(60000);

  before(async function () {
    candyMachine = Keypair.generate();

    const mock = await candyMachineMock(
      connection,
      accounts[0],
      candyMachine,
      accounts[0].publicKey,
      accounts[0].publicKey,
      {
        price: LAMPORTS_PER_SOL,
        itemsAvailable: available,
      }
    );

    liveDate = mock.liveDate;

    candyMachineInspector = await Inspector.fromAddress(
      connection,
      candyMachine.publicKey
    );
  });

  after(function () {
    candyMachineInspector.unwatch();
  });

  it("should be created with proper shape", function () {
    assert.instanceOf(candyMachineInspector, Inspector);
    assert.instanceOf(candyMachineInspector.candyMachineAccount, CandyMachine);
    assert.equal(
      candyMachineInspector.candyMachineAddress.toBase58(),
      candyMachine.publicKey.toBase58()
    );
  });

  describe("utilities", function () {
    describe("items", function () {
      it("should return list of items", async function () {
        const items = await candyMachineInspector.items;

        assert.isArray(items);
        assert.lengthOf(items, available.toNumber());

        items.forEach((item) => {
          assert.property(item, "name");
          assert.property(item, "uri");
        });
      });
    });
    describe("price", function () {
      it("should return correct price of mint", function () {
        const price = candyMachineInspector.price() as BN;

        assert.instanceOf(price, BN);
        assert.isTrue(price.eq(new BN(LAMPORTS_PER_SOL)));
      });
    });
    describe("liveDate", function () {
      it("should return live date of candy machine", function () {
        const goLiveDate = candyMachineInspector.liveDate;

        if (goLiveDate === null) throw new Error("no goLiveDate set");

        assert.instanceOf(goLiveDate, Date);
        assert.equal(goLiveDate.getTime() / 1000, liveDate.toNumber());
      });
    });
    describe("available", function () {
      it("should return total available token", function () {
        const available = candyMachineInspector.available as BN;

        assert.instanceOf(available, BN);
        assert.isTrue(available.eq(available));
      });
    });
    describe("redeemed", function () {
      it("should return total redeemed token", function () {
        const redeemed = candyMachineInspector.redeemed as BN;

        assert.instanceOf(redeemed, BN);
        assert.isTrue(redeemed.eq(new BN(0)));
      });
    });
    describe("remaining", function () {
      it("should return total remaining token", function () {
        const remaining = candyMachineInspector.remaining as BN;

        assert.instanceOf(remaining, BN);
        assert.isTrue(remaining.eq(available.subn(0)));
      });
    });
    describe("isLived", function () {
      it("should return true if already lived", function () {
        const isLived = candyMachineInspector.isLived();

        assert.isBoolean(isLived);
        assert.isTrue(isLived);
      });

      it("should return false if not yet live", function () {
        // 5 minute before live date
        const subtractedDate = new Date(Date.now() - 50000);
        const isLived = candyMachineInspector.isLived(subtractedDate);

        assert.isBoolean(isLived);
        assert.isFalse(isLived);
      });
    });
    describe("isSufficientFund", function () {
      it("should return true if has sufficient fund", async function () {
        const isSufficientFund = await candyMachineInspector.isSufficientFund(
          accounts[0].publicKey
        );

        assert.isBoolean(isSufficientFund);
        assert.isTrue(isSufficientFund);
      });
      it("should return false if has insufficient fund", async function () {
        const isSufficientFund = await candyMachineInspector.isSufficientFund(
          accounts[2].publicKey
        );

        assert.isBoolean(isSufficientFund);
        assert.isFalse(isSufficientFund);
      });
    });
    describe("isAuthority", function () {
      it("should return true if minter is author", async function () {
        const isAuthority = candyMachineInspector.isAuthority(
          accounts[0].publicKey
        );

        assert.isBoolean(isAuthority);
        assert.isTrue(isAuthority);
      });
      it("should return false if not an author", async function () {
        const isAuthority = candyMachineInspector.isAuthority(
          accounts[1].publicKey
        );

        assert.isBoolean(isAuthority);
        assert.isFalse(isAuthority);
      });
    });
    describe("isMintable", function () {
      it("should return true if mintable", async function () {
        const isMintable = await candyMachineInspector.isMintable(
          accounts[0].publicKey
        );

        assert.isArray(isMintable);
        assert.lengthOf(isMintable, 2);
        assert.isBoolean(isMintable[0]);
        assert.isTrue(isMintable[0]);
        assert.isNull(isMintable[1]);
      });
      it("should return false if has insufficient fund", async function () {
        const isMintable = await candyMachineInspector.isMintable(
          accounts[2].publicKey
        );

        assert.isArray(isMintable);
        assert.lengthOf(isMintable, 2);
        assert.isBoolean(isMintable[0]);
        assert.isFalse(isMintable[0]);
        assert.equal(isMintable[1], Unmintable.InsufficientFund);
      });
    });
  });
  describe("watch", function () {
    it("should be able to watch for an update", async function () {
      const mint = Keypair.generate();
      const transaction = await createMintTransaction(
        connection,
        accounts[1].publicKey,
        candyMachine.publicKey,
        mint.publicKey
      );

      const previousRedeemed = candyMachineInspector.candyMachineAccount
        .itemsRedeemed as BN;

      await sendAndConfirmTransaction(connection, transaction, [
        accounts[1],
        mint,
      ]);

      const redeemed = candyMachineInspector.candyMachineAccount
        .itemsRedeemed as BN;

      assert.isTrue(redeemed.gt(previousRedeemed));
    });
  });
});
