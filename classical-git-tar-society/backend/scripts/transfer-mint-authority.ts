import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { GuitarContest } from "../target/types/guitar_contest";

// !! REPLACE THIS WITH YOUR ACTUAL TAR TOKEN MINT ADDRESS !!
const TAR_MINT_ADDRESS = new PublicKey("FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH");

const PROGRAM_ID = new PublicKey("2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

async function transferMintAuthority() {
  // Set up the provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the program
  const program = anchor.workspace.GuitarContest as Program<GuitarContest>;

  console.log("Program ID:", program.programId.toString());
  console.log("Current authority (your wallet):", provider.wallet.publicKey.toString());
  console.log("TAR Mint:", TAR_MINT_ADDRESS.toString());

  // Derive the mint authority PDA
  const [mintAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority")],
    program.programId
  );

  console.log("Program's mint authority PDA:", mintAuthority.toString());
  console.log("\nTransferring mint authority to program's PDA...");

  try {
    const tx = await program.methods
      .transferMintAuthority()
      .accounts({
        tarMint: TAR_MINT_ADDRESS,
        currentAuthority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Success! Transaction signature:", tx);
    console.log(`View on Solana Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    console.log("\n🎉 The program can now mint TAR tokens as rewards!");
  } catch (error) {
    console.error("❌ Error transferring mint authority:", error);
    throw error;
  }
}

transferMintAuthority()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
