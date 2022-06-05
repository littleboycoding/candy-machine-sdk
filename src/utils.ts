import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID } from "@metaplex-foundation/mpl-candy-machine";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

function getCandyMachineFirstCreator(candyMachine: PublicKey) {
  return PublicKey.findProgramAddress(
    [Buffer.from("candy_machine"), candyMachine.toBuffer()],
    CANDY_MACHINE_PROGRAM_ID
  );
}

function getMetadata(mint: PublicKey) {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

function getMasterEdition(mint: PublicKey) {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition")
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

function getCollectionAuthorityRecordPDA(collectionMint: PublicKey, collectionPDA: PublicKey) {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
      Buffer.from("collection_authority"),
      collectionPDA.toBuffer()
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

function getCollectionPDA(candyMachine: PublicKey) {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("collection"),
      candyMachine.toBuffer(),
    ],
    CANDY_MACHINE_PROGRAM_ID
  );
}

export { getMetadata, getCollectionPDA, getMasterEdition, getCandyMachineFirstCreator, getCollectionAuthorityRecordPDA }
