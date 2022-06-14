import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID } from "@metaplex-foundation/mpl-candy-machine";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

function createUint8ArrayFromString(str: string) {
  const encoder = new TextEncoder();

  return encoder.encode(str);
}

function getCandyMachineFirstCreator(candyMachine: PublicKey) {
  return PublicKey.findProgramAddress(
    [createUint8ArrayFromString("candy_machine"), candyMachine.toBuffer()],
    CANDY_MACHINE_PROGRAM_ID
  );
}

function getMetadata(mint: PublicKey) {
  return PublicKey.findProgramAddress(
    [
      createUint8ArrayFromString("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

function getMasterEdition(mint: PublicKey) {
  return PublicKey.findProgramAddress(
    [
      createUint8ArrayFromString("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      createUint8ArrayFromString("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

function getCollectionAuthorityRecordPDA(
  collectionMint: PublicKey,
  collectionPDA: PublicKey
) {
  return PublicKey.findProgramAddress(
    [
      createUint8ArrayFromString("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
      createUint8ArrayFromString("collection_authority"),
      collectionPDA.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

function getCollectionPDA(candyMachine: PublicKey) {
  return PublicKey.findProgramAddress(
    [createUint8ArrayFromString("collection"), candyMachine.toBuffer()],
    CANDY_MACHINE_PROGRAM_ID
  );
}

export {
  getMetadata,
  getCollectionPDA,
  getMasterEdition,
  getCandyMachineFirstCreator,
  getCollectionAuthorityRecordPDA,
};
