// Leaderboard entry type
export type LeaderboardEntry = {
  rank: number;
  address: string;      // Shortened wallet address
  fullAddress: string;  // Full wallet address for tooltip
  label: string;        // e.g., title for contest, "Quiz Score" for quiz
  score: number;        // Vote count or correct answers
  maxScore?: number;    // Optional: total questions for quiz
  passed?: boolean;     // Optional: for quiz pass/fail
};

type LeaderboardProps = {
  title: string;
  entries: LeaderboardEntry[];
  scoreLabel: string;   // e.g., "Votes" or "Score"
  emptyMessage?: string;
  showPassStatus?: boolean;
  currentUserAddress?: string;
};

// Shorten address for display
export const shortenAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const Leaderboard = ({
  title,
  entries,
  scoreLabel,
  emptyMessage = "No entries yet",
  showPassStatus = false,
  currentUserAddress,
}: LeaderboardProps) => {
  return (
    <div className="leaderboard-container">
      <h3 className="leaderboard-title">{title}</h3>
      
      {entries.length === 0 ? (
        <p className="leaderboard-empty">{emptyMessage}</p>
      ) : (
        <div className="leaderboard-table">
          <div className="leaderboard-header">
            <span className="leaderboard-col rank">#</span>
            <span className="leaderboard-col address">Address</span>
            <span className="leaderboard-col label">Entry</span>
            <span className="leaderboard-col score">{scoreLabel}</span>
            {showPassStatus && <span className="leaderboard-col status">Status</span>}
          </div>
          
          {entries.map((entry) => {
            const isCurrentUser = currentUserAddress && entry.fullAddress === currentUserAddress;
            return (
              <div 
                key={entry.fullAddress + entry.label} 
                className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''} ${entry.rank <= 3 ? `top-${entry.rank}` : ''}`}
                title={entry.fullAddress}
              >
                <span className="leaderboard-col rank">
                  {entry.rank === 1 && "🥇"}
                  {entry.rank === 2 && "🥈"}
                  {entry.rank === 3 && "🥉"}
                  {entry.rank > 3 && entry.rank}
                </span>
                <span className="leaderboard-col address">
                  {entry.address}
                  {isCurrentUser && <span className="you-badge">(You)</span>}
                </span>
                <span className="leaderboard-col label">{entry.label}</span>
                <span className="leaderboard-col score">
                  {entry.maxScore !== undefined 
                    ? `${entry.score}/${entry.maxScore}` 
                    : entry.score}
                </span>
                {showPassStatus && (
                  <span className={`leaderboard-col status ${entry.passed ? 'passed' : 'failed'}`}>
                    {entry.passed ? "✓ Passed" : "✗ Failed"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
