import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  TransactionBlockhashCtor,
  Keypair,
} from "@solana/web3.js";
import {
  createMintNftInstruction,
  createSetCollectionDuringMintInstruction,
  CandyMachine,
  CollectionPDA,
} from "@metaplex-foundation/mpl-candy-machine";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  getCandyMachineFirstCreator,
  getMetadata,
  getMasterEdition,
  getCollectionPDA,
  getCollectionAuthorityRecordPDA,
} from "./utils";

/**
 * @description Create Candy machine mint transaction
 *
 * @param connection - cluster connection
 * @param payer - public key of payer
 * @param mint - new mint address
 * @param candyMachine - candy machine address
 * @param transactionOpt - option for transaction initializing
 *
 * @returns transaction
 *
 * @beta
 *
 * @example
 * ```
 * const transaction = await createMintInstructions(connection, payer, mint, candyMachine));
 *
 * await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
 * ```
 */
async function createMintTransaction(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey | Keypair,
  candyMachine: PublicKey,
  transactionOpt?: TransactionBlockhashCtor,
  candyMachineData?: { authority: PublicKey; wallet: PublicKey }
) {
  const mintKeypair = mint instanceof Keypair ? mint : null;
  const mintPubkey = mint instanceof PublicKey ? mint : mint.publicKey;

  const { authority, wallet } =
    candyMachineData ||
    (await CandyMachine.fromAccountAddress(connection, candyMachine));

  const transaction = new Transaction(transactionOpt);

  const [creator, creatorBump] = await getCandyMachineFirstCreator(
    candyMachine
  );
  const associatedToken = await getAssociatedTokenAddress(mintPubkey, payer);
  const [metadata] = await getMetadata(mintPubkey);
  const [masterEdition] = await getMasterEdition(mintPubkey);

  // Create mint account
  transaction.add(
    SystemProgram.createAccount({
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
      fromPubkey: payer,
      newAccountPubkey: mintPubkey,
    })
  );

  // Initialize mint account
  transaction.add(createInitializeMintInstruction(mintPubkey, 0, payer, payer));

  // Create associated token account
  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer,
      associatedToken,
      payer,
      mintPubkey
    )
  );

  // Minting
  transaction.add(
    createMintToInstruction(mintPubkey, associatedToken, payer, 1)
  );

  // Mint NFT from candy machine
  transaction.add(
    createMintNftInstruction(
      {
        payer: payer,
        mint: mintPubkey,
        metadata: metadata,
        candyMachine: candyMachine,
        mintAuthority: payer,
        updateAuthority: payer,
        candyMachineCreator: creator,
        wallet: wallet,
        masterEdition: masterEdition,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY,
      },
      {
        creatorBump: creatorBump,
      }
    )
  );

  // Set collection
  const [collectionPDA] = await getCollectionPDA(candyMachine);

  const exist = await connection
    .getParsedAccountInfo(collectionPDA)
    .then((res) => res.value);

  if (exist) {
    const { mint: collectionMint } = await CollectionPDA.fromAccountAddress(
      connection,
      collectionPDA
    );
    const [collectionMetadata] = await getMetadata(collectionMint);
    const [collectionMasterEdition] = await getMasterEdition(collectionMint);
    const [collectionAuthorityRecord] = await getCollectionAuthorityRecordPDA(
      collectionMint,
      collectionPDA
    );

    transaction.add(
      createSetCollectionDuringMintInstruction({
        candyMachine: candyMachine,
        metadata: metadata,
        payer: payer,
        authority: authority,
        collectionPda: collectionPDA,
        collectionMint: collectionMint,
        collectionMetadata: collectionMetadata,
        collectionMasterEdition: collectionMasterEdition,
        collectionAuthorityRecord: collectionAuthorityRecord,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
    );
  }

  if (mintKeypair) transaction.sign(mintKeypair);

  return transaction;
}

export { createMintTransaction };
