/**
 * Quiz Admin Script
 * 
 * Usage:
 *   yarn run ts-node scripts/quiz-admin.ts init     # Initialize quiz config (one-time)
 *   yarn run ts-node scripts/quiz-admin.ts reset    # Reset quiz version (allows retakes)
 *   yarn run ts-node scripts/quiz-admin.ts status   # Check current quiz config
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Load IDL
const idlPath = path.join(__dirname, "../target/idl/guitar_contest.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

// Program ID
const PROGRAM_ID = new PublicKey("2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU");

// Load wallet from Anchor.toml path
const walletPath = path.join(process.env.HOME || "", "Dev/solana-camp.dev/my-solana-wallet/my-keypair.json");
const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
);

async function main() {
  const command = process.argv[2];
  
  if (!command || !["init", "reset", "status"].includes(command)) {
    console.log("Usage:");
    console.log("  yarn run ts-node scripts/quiz-admin.ts init     # Initialize quiz config (one-time)");
    console.log("  yarn run ts-node scripts/quiz-admin.ts reset    # Reset quiz version (allows retakes)");
    console.log("  yarn run ts-node scripts/quiz-admin.ts status   # Check current quiz config");
    process.exit(1);
  }

  // Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Create wallet wrapper
  const wallet = {
    publicKey: walletKeypair.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(walletKeypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      return txs.map(tx => {
        tx.partialSign(walletKeypair);
        return tx;
      });
    },
  };

  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    preflightCommitment: "confirmed",
  });
  
  const program = new Program(idl as any, provider);

  // Derive quiz config PDA
  const [quizConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("quiz_config")],
    PROGRAM_ID
  );

  console.log("Quiz Config PDA:", quizConfigPda.toBase58());
  console.log("Admin Wallet:", walletKeypair.publicKey.toBase58());
  console.log("");

  if (command === "status") {
    try {
      const config = await (program.account as any).quizConfig.fetch(quizConfigPda);
      console.log("✅ Quiz Config Status:");
      console.log("   Admin:", config.admin.toBase58());
      console.log("   Quiz Version:", config.quizVersion.toNumber());
    } catch (err) {
      console.log("❌ Quiz Config not initialized yet.");
      console.log("   Run 'yarn run ts-node scripts/quiz-admin.ts init' to initialize.");
    }
  } else if (command === "init") {
    try {
      // Check if already initialized
      try {
        await (program.account as any).quizConfig.fetch(quizConfigPda);
        console.log("⚠️ Quiz Config already initialized!");
        const config = await (program.account as any).quizConfig.fetch(quizConfigPda);
        console.log("   Admin:", config.admin.toBase58());
        console.log("   Quiz Version:", config.quizVersion.toNumber());
        return;
      } catch {
        // Not initialized, proceed
      }

      console.log("Initializing Quiz Config...");
      
      const tx = await (program.methods as any)
        .initializeQuizConfig()
        .accounts({
          quizConfig: quizConfigPda,
          admin: walletKeypair.publicKey,
        })
        .signers([walletKeypair])
        .rpc();

      console.log("✅ Quiz Config initialized!");
      console.log("   Transaction:", tx);
      console.log("   Admin:", walletKeypair.publicKey.toBase58());
      console.log("   Quiz Version: 1");
    } catch (err) {
      console.error("❌ Error initializing quiz config:", err);
    }
  } else if (command === "reset") {
    try {
      // Check current version
      let currentVersion = 0;
      try {
        const config = await (program.account as any).quizConfig.fetch(quizConfigPda);
        currentVersion = config.quizVersion.toNumber();
        console.log("Current Quiz Version:", currentVersion);
      } catch {
        console.log("❌ Quiz Config not initialized. Run 'init' first.");
        return;
      }

      console.log("Resetting Quiz Version...");
      
      const tx = await (program.methods as any)
        .resetQuizVersion()
        .accounts({
          quizConfig: quizConfigPda,
          admin: walletKeypair.publicKey,
        })
        .signers([walletKeypair])
        .rpc();

      console.log("✅ Quiz Version reset!");
      console.log("   Transaction:", tx);
      console.log("   New Version:", currentVersion + 1);
      console.log("   All users can now retake the quiz!");
    } catch (err) {
      console.error("❌ Error resetting quiz version:", err);
    }
  }
}

main().catch(console.error);
