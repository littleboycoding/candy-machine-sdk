import { Connection, PublicKey } from "@solana/web3.js";
import {
  Metadata,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { getCandyMachineFirstCreator } from "./utils";
import {
  MAX_METADATA_LEN,
  CREATOR_ARRAY_START,
  CONFIG_ARRAY_START_V2,
  CONFIG_LINE_SIZE_V2,
  MAX_NAME_LENGTH,
} from "./constants";
import {
  CandyMachine,
  ConfigLine,
} from "@metaplex-foundation/mpl-candy-machine";

/**
 * @private
 */
function parseConfigLine(configLines: Buffer, start: number = 0): Item[] {
  const totalItem = configLines.length / CONFIG_LINE_SIZE_V2;
  const items: Buffer[] = [];

  for (let i = start; i < totalItem; i++) {
    const start = CONFIG_LINE_SIZE_V2 * i;
    const end = -((totalItem - 1 - i) * CONFIG_LINE_SIZE_V2);

    const slice = configLines.slice(start, end || undefined);

    items.push(slice);
  }

  const splittedItems = items.map((item) => {
    const name = item.slice(4, 4 + MAX_NAME_LENGTH);
    const uri = item.slice(4 + MAX_NAME_LENGTH + 4);

    return { name: name.toString(), uri: uri.toString() };
  });

  return splittedItems;
}

type Item = ConfigLine & { metadata?: Metadata };

/**
 * Get all minted from candy machine
 *
 * @param connection - Connection instance
 * @param candyMachine - candy machine address
 *
 * @returns List of items
 */
async function getMinted(
  connection: Connection,
  candyMachine: PublicKey
): Promise<Item[]> {
  const [firstCreator] = await getCandyMachineFirstCreator(candyMachine);
  const metadataAccounts = await connection.getProgramAccounts(
    TOKEN_METADATA_PROGRAM_ID,
    {
      // dataSlice: { offset: 33, length: 32 },
      filters: [
        { dataSize: MAX_METADATA_LEN },

        {
          memcmp: {
            offset: CREATOR_ARRAY_START,
            bytes: firstCreator.toBase58(),
          },
        },
      ],
    }
  );

  const items = metadataAccounts.map(({ account }) => {
    const [metadata] = Metadata.fromAccountInfo(account);

    return {
      name: metadata.data.name,
      uri: metadata.data.uri,
      metadata: metadata,
    };
  });

  return items;
}

/**
 * Get all unminted from candy machine
 *
 * @param connection - Connection instance
 * @param candyMachine - candy machine address
 *
 * @experimental
 *
 * @returns List of items
 */
async function _getUnminted(
  connection: Connection,
  candyMachine: PublicKey
): Promise<Item[]> {
  const candyMachineAccount = await connection.getAccountInfo(candyMachine);

  if (!candyMachineAccount) throw new Error("no candy machine found");

  const [{ itemsRedeemed }] = CandyMachine.fromAccountInfo(candyMachineAccount);

  const data = candyMachineAccount.data.slice(CONFIG_ARRAY_START_V2 + 4);
  const configLines = data.slice(0, -(data.length % CONFIG_LINE_SIZE_V2));

  const items = parseConfigLine(configLines, Number(itemsRedeemed));

  return items;
}

/**
 * Get all items from candy machine
 *
 * @param connection - Connection instance
 * @param candyMachine - candy machine address
 *
 * @returns List of items
 */
async function getAll(
  connection: Connection,
  candyMachine: PublicKey
): Promise<Item[]> {
  const candyMachineAccount = await connection.getAccountInfo(candyMachine);

  if (!candyMachineAccount) throw new Error("no candy machine found");

  const data = candyMachineAccount.data.slice(CONFIG_ARRAY_START_V2 + 4);
  const configLines = data.slice(0, -(data.length % CONFIG_LINE_SIZE_V2));

  const items = parseConfigLine(configLines);

  return items;
}

export { getMinted, getAll };
