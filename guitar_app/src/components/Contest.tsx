import { useState, useEffect, useMemo } from "react";
// We use useWallet (not useAnchorWallet)
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Correct imports for both the IDL and the Type
import IDL from "../idl/guitar_contest.json";
import type { GuitarContest } from "../types/guitar_contest.ts";
import { Leaderboard, shortenAddress } from "./Leaderboard";
import type { LeaderboardEntry } from "./Leaderboard";

// --- Program ID (for reference) ---
// const PROGRAM_ID = new PublicKey("2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU");
// -------------------------------------------

// Define the structure of a submission object, including its public key
type Submission = {
  publicKey: PublicKey;
  account: {
    contestant: PublicKey;
    title: string;
    youtubeId: string; // Anchor IDL converts Rust's snake_case (youtube_id) to camelCase
    voteCount: anchor.BN; // Anchor converts Rust's u64 to BN (BigNumber)
  };
};

// This function creates a new, valid program object
const getProgram = (connection: anchor.web3.Connection, wallet: any) => {
  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    preflightCommitment: "processed",
    commitment: "processed",
  });
  // This uses your fix: (IDL as any)
  return new Program<GuitarContest>(IDL as any, provider);
};


export const Contest = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  // We no longer store the program in state, which simplifies the logic
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [title, setTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [loading, setLoading] = useState(false);

  // This is the combined useEffect hook that fixes the race condition.
  // It runs when the wallet's public key is available.
  useEffect(() => {
    // This async function will set up the program AND fetch submissions
    const setupAndFetch = async () => {
      // We only run this if the wallet is fully connected
      if (wallet.publicKey && wallet.signTransaction) {
        setLoading(true);
        // 1. Create the provider and program *inside* the effect
        const program = getProgram(connection, wallet);

        // 2. NOW that the program is created, we can safely fetch submissions
        try {
          // --- THIS IS THE FIX for the 'getProgramAccounts' error ---
          // We add this check to ensure the IDL has been processed
          // before we try to use program.account
          if (!program || !program.account || !program.account.submissionAccount) {
            console.error("Error: Program or submissionAccount not initialized yet.");
            setSubmissions([]); // Clear on error
            setLoading(false);
            return; // Exit early
          }
          // --- END FIX ---

          const allSubmissions = (await program.account.submissionAccount.all()) as Submission[];
          allSubmissions.sort((a, b) =>
            b.account.voteCount.cmp(a.account.voteCount)
          );
          setSubmissions(allSubmissions);
        } catch (err) {
          console.error("Error fetching submissions:", err);
          setSubmissions([]); // Clear on error
        }
        setLoading(false);

      } else {
        // Wallet is disconnected
        setSubmissions([]); // Clear submissions
      }
    };

    setupAndFetch();

  }, [wallet.publicKey, connection]); // This is the only trigger we need

  // This is the standalone function for the refresh button
  const handleRefresh = async () => {
    if (!wallet.publicKey) return; // Don't run if wallet isn't connected
    setLoading(true);
    try {
      const program = getProgram(connection, wallet); // Create a fresh program
      const allSubmissions = (await program.account.submissionAccount.all()) as Submission[];
      allSubmissions.sort((a, b) =>
        b.account.voteCount.cmp(a.account.voteCount)
      );
      setSubmissions(allSubmissions);
    } catch (err) {
      console.error("Error refreshing submissions:", err);
    }
    setLoading(false);
  };

  // 4. Handle "Create Submission" button click
  const handleCreateSubmission = async () => {
    if (!wallet.publicKey) {
      alert("Please connect your wallet to submit.");
      return;
    }

    const program = getProgram(connection, wallet);
    const submissionKeypair = anchor.web3.Keypair.generate();

    setLoading(true);
    try {
      const tx = await program.methods
        .createSubmission(title, youtubeId)
        .accounts({
          submission: submissionKeypair.publicKey,
          user: wallet.publicKey,
        })
        .signers([submissionKeypair]) // Sign with the new account's keypair
        .rpc();

      alert(`Success! Submission created. Tx: ${tx}`);
      // Clear form and refetch submissions
      setTitle("");
      setYoutubeId("");
      handleRefresh(); // Call our new refresh function
    } catch (err) {
      console.error(err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  // 5. Handle "Vote" button click
  const handleVote = async (submissionPubkey: PublicKey) => {
    if (!wallet.publicKey) {
      alert("Please connect your wallet to vote.");
      return;
    }

    const program = getProgram(connection, wallet);
    
    // Get the submission to find the performer
    const submission = submissions.find(s => s.publicKey.equals(submissionPubkey));
    if (!submission) {
      alert("Submission not found");
      return;
    }
    
    const performer = submission.account.contestant;
    
    // TAR token mint address
    const TAR_MINT = new PublicKey("FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH");

    setLoading(true);
    try {
      const tx = await program.methods
        .vote()
        .accounts({
          submission: submissionPubkey,
          performer: performer,
          tarMint: TAR_MINT,
          user: wallet.publicKey,
        })
        .rpc();
      alert(`Vote cast! Tx: ${tx}`);
      handleRefresh(); // Call our new refresh function
    } catch (err) {
      console.error(err);
      // This improved check catches the "already exists" error
      const errString = err instanceof Error ? err.message : String(err);
      if (errString.includes("0x1771") || errString.includes("already in use")) {
        alert("Error: You have already voted for this submission!");
      } else {
        alert(`Error: ${errString}`);
      }
    }
    setLoading(false);
  };
  
  // --- RE-ADDING THIS FUNCTION ---
  // 6. Handle "Update Submission" button click
  const handleUpdateSubmission = async (submissionPubkey: PublicKey) => {
    if (!wallet.publicKey) {
      alert("Please connect your wallet to update.");
      return;
    }
    
    // Get new data from the user
    const currentSubmission = submissions.find(s => s.publicKey.equals(submissionPubkey));
    const newTitle = prompt("Enter a new title:", currentSubmission?.account.title);
    const newYoutubeId = prompt("Enter a new YouTube ID:", currentSubmission?.account.youtubeId);

    if (!newTitle || !newYoutubeId) {
      alert("Update cancelled.");
      return;
    }

    setLoading(true);
    const program = getProgram(connection, wallet);

    try {
      const tx = await program.methods
        // Make sure your Rust program has this function!
        .updateSubmission(newTitle, newYoutubeId) 
        .accounts({
          submission: submissionPubkey,
          user: wallet.publicKey,
        })
        .rpc();

      alert(`Success! Submission updated. Tx: ${tx}`);
      handleRefresh(); // Refresh the list to show new data
    } catch (err) {
      console.error(err);
      // This will catch the "NotContestant" error from our Rust program
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };
  // --- END NEW FUNCTION ---

  // Compute leaderboard entries from submissions
  const leaderboardEntries: LeaderboardEntry[] = useMemo(() => {
    return submissions
      .filter(s => s.account.voteCount.toNumber() > 0)
      .sort((a, b) => b.account.voteCount.cmp(a.account.voteCount))
      .slice(0, 10) // Top 10
      .map((s, index) => ({
        rank: index + 1,
        address: shortenAddress(s.account.contestant.toBase58()),
        fullAddress: s.account.contestant.toBase58(),
        label: s.account.title,
        score: s.account.voteCount.toNumber(),
      }));
  }, [submissions]);

  // Render this if the wallet isn't connected
  if (!wallet.publicKey) {
    return (
      <h2 style={{ textAlign: "center" }}>
        Please connect your wallet to see the contest.
      </h2>
    );
  }

  // Render this once the wallet is connected
  return (
    // --- Main flex container ---
    <div className="contest-body">
      
      {/* --- Left column (list) --- */}
      <div className="submission-container">
        <button 
          onClick={handleRefresh} 
          disabled={loading} 
          style={{marginBottom: "20px", fontSize: "1rem", padding: "10px", width: "100%"}}
        >
          {loading ? "Refreshing..." : "Refresh Submissions"}
        </button>
        
        <div className="submission-list">
          {submissions.map((s) => (
            <SubmissionCard
              key={s.publicKey.toBase58()}
              submission={s}
              onVote={handleVote}
              // --- RE-ADDING THIS PROP ---
              onUpdate={handleUpdateSubmission} 
              // --- END RE-ADDING ---
              loading={loading}
              connectedWallet={wallet.publicKey} 
            />
          ))}
        </div>
      </div>

      {/* --- Right column (form) --- */}
      <div className="form-container">
        <div className="submission-form">
          <h2>Submit Your Performance</h2>
          <input
            type="text"
            placeholder="Song Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="YouTube Video ID (e.g. g1v_M0_b-X0)"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
          />
          <button
            onClick={handleCreateSubmission}
            disabled={loading || !title || !youtubeId}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>

        <div className="token-rewards-box">
          <h3>🪙 TAR Token Rewards</h3>
          <p className="token-rule">1 vote = 3 TAR</p>
        </div>

        {/* Leaderboard */}
        <Leaderboard
          title="🏆 Top Performers"
          entries={leaderboardEntries}
          scoreLabel="Votes"
          emptyMessage="No votes yet. Be the first to vote!"
          currentUserAddress={wallet.publicKey?.toBase58()}
        />
      </div>
    </div>
  );
};

// --- Single Submission Card Component (Updated) ---
// --- RE-ADDING THIS PROP ---
type CardProps = {
  submission: Submission;
  onVote: (key: PublicKey) => void;
  onUpdate: (key: PublicKey) => void; // <-- This was missing
  loading: boolean;
  connectedWallet: PublicKey | null; 
};
// --- END RE-ADDING ---

const SubmissionCard = ({ submission, onVote, onUpdate, loading, connectedWallet }: CardProps) => {
  const { publicKey, account } = submission;
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${account.youtubeId}`;
  const isOwner = connectedWallet && connectedWallet.equals(account.contestant);

  return (
    <div className="submission-card">
      <iframe
        className="video-embed"
        src={youtubeEmbedUrl}
        title={account.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      <div className="submission-info">
        <h3>{account.title}</h3>
        <p>Submitted by: {account.contestant.toBase58().substring(0, 8)}...</p>
        <p>
          Total Votes: <strong>{account.voteCount.toString()}</strong>
        </p>
        
        {/* Button row */}
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Vote Button */}
          <button 
            onClick={() => onVote(publicKey)} 
            disabled={loading || (isOwner ?? false)}
            style={{
              backgroundColor: isOwner ? "#4a4e57" : "#5cb85c",
              cursor: isOwner ? "not-allowed" : "pointer",
              width: "100%", 
            }}
          >
            {isOwner ? "Owner (Can't Vote)" : (loading ? "..." : "Vote")}
          </button>
          
          {/* --- RE-ADDING THIS BUTTON --- */}
          <button 
            onClick={() => onUpdate(publicKey)} // Pass the prop
            disabled={loading || !isOwner} // Only owner can click
            style={{
              backgroundColor: isOwner ? "#f0ad4e" : "#4a4e57", 
              cursor: isOwner ? "pointer" : "not-allowed",
              width: "100%",
            }}
          >
            {isOwner ? "Edit (Owner)" : (loading ? "..." : "Edit (Owner Only)")}
          </button>
          {/* --- END RE-ADDING --- */}
        </div>
      </div>
    </div>
  );
};