import {
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createInitializeCandyMachineInstruction,
  createAddConfigLinesInstruction,
  PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID,
  CandyMachineArgs,
  CandyMachineData,
} from "@metaplex-foundation/mpl-candy-machine";
import BN from "bn.js";
import { CONFIG_LINE_SIZE_V2, CONFIG_ARRAY_START_V2 } from "./constants";

function getSize(data: CandyMachineData) {
  const available =
    data.itemsAvailable instanceof BN
      ? data.itemsAvailable.toNumber()
      : data.itemsAvailable;

  const size =
    CONFIG_ARRAY_START_V2 +
    4 +
    available * CONFIG_LINE_SIZE_V2 +
    8 +
    2 * (Math.floor(available / 8) + 1);

  return size;
}

/**
 * Deploy candy machine mock
 *
 * @returns transaction signature
 */
async function candyMachineMock(
  connection: Connection,
  payer: Signer,
  candyMachine: Signer,
  authority: PublicKey,
  wallet: PublicKey,
  candyMachineData: {
    price: BN | number;
    itemsAvailable: BN | number;
  }
) {
  const transaction = new Transaction();
  const liveDate = new BN(Date.now() / 1000);

  const data: CandyMachineData = {
    uuid: candyMachine.publicKey.toBase58().slice(0, 6),
    creators: [
      {
        address: payer.publicKey,
        share: 100,
        verified: true,
      },
    ],
    price: candyMachineData.price,
    symbol: "MK",
    isMutable: true,
    maxSupply: 0,
    sellerFeeBasisPoints: 500,
    itemsAvailable: candyMachineData.itemsAvailable,
    retainAuthority: true,
    gatekeeper: null,
    hiddenSettings: null,
    goLiveDate: liveDate,
    endSettings: null,
    whitelistMintSettings: null,
  };
  const args: CandyMachineArgs = {
    wallet: wallet,
    authority: authority,
    itemsRedeemed: 0,
    tokenMint: null,
    data,
  };

  const size = getSize(data);

  // Create account for candy machine
  transaction.add(
    SystemProgram.createAccount({
      programId: CANDY_MACHINE_PROGRAM_ID,
      space: size,
      lamports: await connection.getMinimumBalanceForRentExemption(size),
      fromPubkey: payer.publicKey,
      newAccountPubkey: candyMachine.publicKey,
    })
  );

  // Initialize candy machine
  transaction.add(
    createInitializeCandyMachineInstruction(
      {
        authority: authority,
        wallet: wallet,
        payer: payer.publicKey,
        candyMachine: candyMachine.publicKey,
      },
      {
        data: data,
      }
    )
  );

  await sendAndConfirmTransaction(connection, transaction, [
    payer,
    candyMachine,
  ]);

  // Add config line
  const configPromises: Promise<string>[] = [];
  for (let i = 0; i < candyMachineData.itemsAvailable; i++) {
    const transaction = new Transaction().add(
      createAddConfigLinesInstruction(
        {
          candyMachine: candyMachine.publicKey,
          authority: authority,
        },
        {
          index: i,
          configLines: [
            {
              uri: "https://example.org/" + i,
              name: "EXAMPLE #" + i,
            },
          ],
        }
      )
    );

    configPromises.push(
      sendAndConfirmTransaction(connection, transaction, [payer])
    );
  }
  await Promise.all(configPromises);

  // TODO
  // transaction.add(
  //   createSetCollectionInstruction()
  // );

  return {
    liveDate,
  };
}

export default candyMachineMock;
