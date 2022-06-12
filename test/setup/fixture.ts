import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { startAndConnect } from "solana-test-validator-js";
import { PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID } from "@metaplex-foundation/mpl-candy-machine";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export async function mochaGlobalSetup(this: Mocha.Context) {
  const [, cleanup] = await startAndConnect(
    [
      "--bpf-program",
      CANDY_MACHINE_PROGRAM_ID.toBase58(),
      "./test/mocks/mpl/candy_machine.so",
      "--bpf-program",
      TOKEN_METADATA_PROGRAM_ID.toBase58(),
      "./test/mocks/mpl/token_metadata.so",
    ],
    {
      exec: "solana-test-validator",
      logging: false,
      accounts: {
        number: 2,
        lamports: LAMPORTS_PER_SOL * 10000,
      },
    }
  );

  this.cleanup = cleanup;
}

export function mochaGlobalTeardown(this: Mocha.Context) {
  if (this.cleanup) this.cleanup();
}
