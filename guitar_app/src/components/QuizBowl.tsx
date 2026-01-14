import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

// Correct imports for both the IDL and the Type
import IDL from "../idl/guitar_contest.json";
import type { GuitarContest } from "../types/guitar_contest.ts";
import { Leaderboard, shortenAddress } from "./Leaderboard";
import type { LeaderboardEntry } from "./Leaderboard";

// --- Program ID (same as Contest) ---
const PROGRAM_ID = new PublicKey("2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU");

// TAR token mint address
const TAR_MINT = new PublicKey("FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH");

// Sample questions (in production, these could be fetched from a backend)
const QUESTIONS = [
  {
    id: 1,
    question: "Who is considered the father of the modern classical guitar?",
    options: ["Andrés Segovia", "Francisco Tárrega", "Fernando Sor", "Mauro Giuliani"],
    correctIndex: 1, // Francisco Tárrega
  },
  {
    id: 2,
    question: "What is the standard tuning of a classical guitar from lowest to highest string?",
    options: ["D-A-D-G-B-E", "E-A-D-G-B-E", "E-B-G-D-A-E", "D-G-B-E-A-D"],
    correctIndex: 1, // E-A-D-G-B-E
  },
  {
    id: 3,
    question: "Which piece is NOT composed by J.S. Bach?",
    options: ["Chaconne in D minor", "Lute Suite No. 4", "Recuerdos de la Alhambra", "Prelude in C major"],
    correctIndex: 2, // Recuerdos de la Alhambra (by Tárrega)
  },
  {
    id: 4,
    question: "What technique involves rapidly alternating the same note with different fingers?",
    options: ["Rasgueado", "Tremolo", "Picado", "Alzapúa"],
    correctIndex: 1, // Tremolo
  },
  {
    id: 5,
    question: "Who composed 'Asturias (Leyenda)'?",
    options: ["Francisco Tárrega", "Isaac Albéniz", "Joaquín Rodrigo", "Manuel de Falla"],
    correctIndex: 1, // Isaac Albéniz
  },
];

// Quiz state type - matches on-chain QuizState
type QuizState = {
  totalQuestions: number;
  correctAnswers: number;
  quizCompleted: boolean;
  tokensAwarded: boolean;
};

// Local answer tracking
type LocalAnswers = {
  [questionId: number]: number; // questionId -> selectedIndex
};

// This function creates a new, valid program object
const getProgram = (connection: anchor.web3.Connection, wallet: any) => {
  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    preflightCommitment: "processed",
    commitment: "processed",
  });
  return new Program<GuitarContest>(IDL as any, provider);
};

export const QuizBowl = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [localAnswers, setLocalAnswers] = useState<LocalAnswers>({});
  const [quizAlreadyTaken, setQuizAlreadyTaken] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(localAnswers).length;
  const allQuestionsAnswered = answeredCount === totalQuestions;

  // Fetch quiz state on wallet connect - check if already completed
  useEffect(() => {
    const fetchQuizState = async () => {
      if (wallet.publicKey && wallet.signTransaction) {
        setLoading(true);
        try {
          const program = getProgram(connection, wallet);
          
          // Derive the quiz state PDA
          const [quizStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("quiz_state"), wallet.publicKey.toBuffer()],
            PROGRAM_ID
          );

          // Also check for completion receipt
          const [completionReceiptPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("quiz_completion"), wallet.publicKey.toBuffer()],
            PROGRAM_ID
          );

          try {
            // Check if completion receipt exists (quiz already taken)
            const receiptInfo = await connection.getAccountInfo(completionReceiptPda);
            if (receiptInfo) {
              setQuizAlreadyTaken(true);
              // Try to fetch the quiz state for display
              try {
                if (program.account && (program.account as any).quizState) {
                  const state = await (program.account as any).quizState.fetch(quizStatePda);
                  setQuizState({
                    totalQuestions: (state.totalQuestions as anchor.BN).toNumber(),
                    correctAnswers: (state.correctAnswers as anchor.BN).toNumber(),
                    quizCompleted: state.quizCompleted,
                    tokensAwarded: state.tokensAwarded,
                  });
                }
              } catch {
                // State fetch failed but receipt exists
              }
            } else {
              // No receipt - quiz not taken yet
              setQuizAlreadyTaken(false);
              setQuizState(null);
            }
          } catch {
            // Quiz not taken yet
            setQuizAlreadyTaken(false);
            setQuizState(null);
          }
        } catch (err) {
          console.error("Error fetching quiz state:", err);
        }
        setLoading(false);
      }
    };

    fetchQuizState();
  }, [wallet.publicKey, connection]);

  // Fetch all quiz completions for leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!wallet.publicKey || !wallet.signTransaction) return;
      
      try {
        const program = getProgram(connection, wallet);
        
        // Try to fetch all QuizState accounts
        if (program.account && (program.account as any).quizState) {
          try {
            const allQuizStates = await (program.account as any).quizState.all();
            
            const entries: LeaderboardEntry[] = allQuizStates
              .filter((s: any) => s.account.quizCompleted)
              .sort((a: any, b: any) => {
                // Sort by correct answers descending, then by pass status
                const aCorrect = (a.account.correctAnswers as anchor.BN).toNumber();
                const bCorrect = (b.account.correctAnswers as anchor.BN).toNumber();
                if (bCorrect !== aCorrect) return bCorrect - aCorrect;
                // If same score, passed users come first
                if (a.account.tokensAwarded !== b.account.tokensAwarded) {
                  return a.account.tokensAwarded ? -1 : 1;
                }
                return 0;
              })
              .slice(0, 10)
              .map((s: any, index: number) => {
                const userAddress = (s.account.user as PublicKey).toBase58();
                const totalQ = (s.account.totalQuestions as anchor.BN).toNumber();
                const correctA = (s.account.correctAnswers as anchor.BN).toNumber();
                const passed = s.account.tokensAwarded;
                
                return {
                  rank: index + 1,
                  address: shortenAddress(userAddress),
                  fullAddress: userAddress,
                  label: `${Math.round((correctA / totalQ) * 100)}%`,
                  score: correctA,
                  maxScore: totalQ,
                  passed: passed,
                };
              });
            
            setLeaderboardEntries(entries);
          } catch (err) {
            console.log("Could not fetch quiz leaderboard:", err);
            setLeaderboardEntries([]);
          }
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      }
    };

    fetchLeaderboard();
  }, [wallet.publicKey, connection, quizAlreadyTaken]); // Re-fetch when user completes quiz

  // Save answer locally (no on-chain submission per question)
  const handleSaveAnswer = () => {
    if (selectedAnswer === null) return;
    
    setLocalAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }));
    
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    if (isCorrect) {
      setFeedback("✓ Answer saved!");
    } else {
      setFeedback(`✓ Answer saved. (Correct answer: ${currentQuestion.options[currentQuestion.correctIndex]})`);
    }
  };

  // Calculate score from local answers
  const calculateScore = (): { correct: number; total: number } => {
    let correct = 0;
    QUESTIONS.forEach(q => {
      if (localAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return { correct, total: QUESTIONS.length };
  };

  // Complete quiz and submit to blockchain
  const handleCompleteQuiz = async () => {
    if (!wallet.publicKey || !allQuestionsAnswered) return;

    setLoading(true);
    setFeedback(null);

    const { correct, total } = calculateScore();
    const percentage = Math.round((correct / total) * 100);
    const passed = percentage >= 80;

    try {
      const program = getProgram(connection, wallet);

      // Check if the instruction exists in the program
      if (!(program.methods as any).completeQuiz) {
        // Program not deployed yet - simulate locally
        setQuizState({
          totalQuestions: total,
          correctAnswers: correct,
          quizCompleted: true,
          tokensAwarded: passed,
        });
        setQuizAlreadyTaken(true);
        
        if (passed) {
          setFeedback(`🎉 You passed with ${percentage}%! (Note: Program not deployed yet - no tokens minted)`);
        } else {
          setFeedback(`📊 You scored ${percentage}%. Need 80% to earn TAR. Quiz completed!`);
        }
        setLoading(false);
        return;
      }

      const tx = await (program.methods as any)
        .completeQuiz(new anchor.BN(total), new anchor.BN(correct))
        .accounts({
          tarMint: TAR_MINT,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Quiz completed! Tx:", tx);

      setQuizState({
        totalQuestions: total,
        correctAnswers: correct,
        quizCompleted: true,
        tokensAwarded: passed,
      });
      setQuizAlreadyTaken(true);

      if (passed) {
        setFeedback(`🎉 Congratulations! You passed with ${percentage}%! You earned 1 TAR token!`);
      } else {
        setFeedback(`📊 You scored ${percentage}%. Need 80% to earn TAR. Better luck... wait, there's no next time! 😅`);
      }

    } catch (err) {
      console.error("Error completing quiz:", err);
      const errString = err instanceof Error ? err.message : String(err);
      
      if (errString.includes("already in use") || errString.includes("0x0")) {
        setFeedback("⚠️ You have already completed this quiz!");
        setQuizAlreadyTaken(true);
      } else {
        setFeedback(`Error: ${errString}`);
      }
    }
    
    setLoading(false);
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(localAnswers[QUESTIONS[currentQuestionIndex + 1]?.id] ?? null);
      setFeedback(null);
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(localAnswers[QUESTIONS[currentQuestionIndex - 1]?.id] ?? null);
      setFeedback(null);
    }
  };

  // Render if wallet not connected
  if (!wallet.publicKey) {
    return (
      <h2 style={{ textAlign: "center" }}>
        Please connect your wallet to participate in the Quiz Bowl.
      </h2>
    );
  }

  // Render if quiz already taken
  if (quizAlreadyTaken && quizState) {
    const percentage = Math.round((quizState.correctAnswers / quizState.totalQuestions) * 100);
    return (
      <div className="contest-body">
        {/* Left column - Quiz result */}
        <div className="submission-container">
          <div className="quiz-stats" style={{ maxWidth: "600px" }}>
            <h3>📊 Quiz Completed</h3>
            <p>You have already taken this quiz.</p>
            <p>Score: <strong>{quizState.correctAnswers}/{quizState.totalQuestions}</strong> ({percentage}%)</p>
            <p>TAR Earned: <strong>{quizState.tokensAwarded ? 1 : 0}</strong></p>
            {quizState.tokensAwarded ? (
              <p style={{ color: "#5cb85c" }}>🎉 You passed and earned 1 TAR!</p>
            ) : (
              <p style={{ color: "#d9534f" }}>You needed 80% to earn TAR.</p>
            )}
          </div>
        </div>

        {/* Right column - Leaderboard */}
        <div className="form-container">
          <div className="token-rewards-box">
            <h3>🪙 Quiz Bowl Rules</h3>
            <p className="token-rule">One attempt per account • 80%+ correct = 1 TAR</p>
          </div>
          
          <Leaderboard
            title="🏆 Quiz Bowl Leaderboard"
            entries={leaderboardEntries}
            scoreLabel="Score"
            emptyMessage="No quiz completions yet. Be the first!"
            showPassStatus={true}
            currentUserAddress={wallet.publicKey?.toBase58()}
          />
        </div>
      </div>
    );
  }

  const isQuestionAnswered = localAnswers[currentQuestion.id] !== undefined;
  const { correct: currentCorrect } = calculateScore();

  return (
    <div className="contest-body">
      {/* Left column - Quiz content */}
      <div className="submission-container">
        {/* Stats Panel */}
        <div className="quiz-stats" style={{ maxWidth: "600px", marginBottom: "20px" }}>
          <h3>📊 Quiz Progress</h3>
          <p>Questions Answered: <strong>{answeredCount}/{totalQuestions}</strong></p>
          <p>Current Score: <strong>{currentCorrect}/{answeredCount || 0}</strong></p>
          {allQuestionsAnswered && (
            <p style={{ color: currentCorrect >= 4 ? "#5cb85c" : "#f0ad4e" }}>
              {currentCorrect >= 4 ? "✓ Passing score!" : "Need 4/5 (80%) to pass"}
            </p>
          )}
        </div>

        {/* Question Card */}
        <div className="quiz-question-card" style={{ maxWidth: "600px" }}>
          <div className="question-header">
            <span className="question-number">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          </div>
          
          <h2 className="question-text">{currentQuestion.question}</h2>
          
          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${selectedAnswer === index ? 'selected' : ''} ${isQuestionAnswered && localAnswers[currentQuestion.id] === index ? 'selected' : ''}`}
                onClick={() => setSelectedAnswer(index)}
                disabled={loading}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                {option}
              </button>
            ))}
          </div>

          {feedback && (
            <div className={`feedback ${feedback.includes('passed') || feedback.includes('saved') ? 'correct' : 'incorrect'}`}>
              {feedback}
            </div>
          )}

          <div className="quiz-actions">
            <button 
              onClick={handlePrevQuestion} 
              disabled={currentQuestionIndex === 0}
              className="nav-button"
            >
              ← Previous
            </button>
            
            {!isQuestionAnswered ? (
              <button
                onClick={handleSaveAnswer}
                disabled={selectedAnswer === null || loading}
                className="submit-button"
              >
                Save Answer
              </button>
            ) : (
              <button
                onClick={handleSaveAnswer}
                disabled={selectedAnswer === null || loading}
                className="submit-button"
                style={{ backgroundColor: "#5cb85c" }}
              >
                Update Answer
              </button>
            )}
            
            <button 
              onClick={handleNextQuestion} 
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="nav-button"
            >
              Next →
            </button>
          </div>

          {/* Complete Quiz Button */}
          {allQuestionsAnswered && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={handleCompleteQuiz}
                disabled={loading}
                className="submit-button"
                style={{ 
                  backgroundColor: "#f0ad4e", 
                  padding: "15px 40px",
                  fontSize: "1.1rem"
                }}
              >
                {loading ? "Submitting..." : "🏆 Complete Quiz & Claim Reward"}
              </button>
              <p style={{ marginTop: "10px", color: "#ccc", fontSize: "0.9rem" }}>
                ⚠️ Warning: You can only submit once!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right column - Rules & Leaderboard */}
      <div className="form-container">
        <div className="token-rewards-box">
          <h3>🪙 Quiz Bowl Rules</h3>
          <p className="token-rule">One attempt per account • 80%+ correct (4/5) = 1 TAR</p>
        </div>

        <Leaderboard
          title="🏆 Quiz Bowl Leaderboard"
          entries={leaderboardEntries}
          scoreLabel="Score"
          emptyMessage="No quiz completions yet. Be the first!"
          showPassStatus={true}
          currentUserAddress={wallet.publicKey?.toBase58()}
        />
      </div>
    </div>
  );
};
