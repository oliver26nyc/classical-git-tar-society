import { useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import a local CSS file for styling
import "./App.css";

// Import the wallet adapter's CSS
import "@solana/wallet-adapter-react-ui/styles.css";

// Import components
import { Contest } from "./components/Contest";
import { UnderConstruction } from "./components/UnderConstruction";
import { TokenBalance } from "./components/WalletBalance";

type Page = "competition" | "composer" | "sheet-music" | "lesson-hub" | "discussion";

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [], [network]); // Auto-detects Phantom, etc.
  const [currentPage, setCurrentPage] = useState<Page>("competition");

  const renderPage = () => {
    switch (currentPage) {
      case "competition":
        return <Contest />;
      case "composer":
        return <UnderConstruction pageName="Composer Studio" tokenRule="1 published composition = 3 PEG" />;
      case "sheet-music":
        return <UnderConstruction pageName="Sheet Music Exchange" tokenRule="1 sheet = 1 PEG" />;
      case "lesson-hub":
        return <UnderConstruction pageName="Lesson Hub" tokenRule="1 booked lesson = 3 PEG" />;
      case "discussion":
        return <UnderConstruction pageName="Discussion Forum" tokenRule="Active participation earns PEG tokens" />;
      default:
        return <Contest />;
    }
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Main App Layout */}
          <div className="app-container">
            <header className="app-header">
              <h1>🎼 Classical Guitar Peg Society</h1>
              <div className="wallet-balance-container">
                <WalletMultiButton />
                <TokenBalance />
              </div>
            </header>
            
            <div className="app-body">
              {/* Left Sidebar */}
              <aside className="sidebar">
                <nav className="sidebar-nav">
                  <button
                    className={`nav-item ${currentPage === "competition" ? "active" : ""}`}
                    onClick={() => setCurrentPage("competition")}
                  >
                    Competition
                  </button>
                  <button
                    className={`nav-item ${currentPage === "composer" ? "active" : ""}`}
                    onClick={() => setCurrentPage("composer")}
                  >
                    Composer Studio
                  </button>
                  <button
                    className={`nav-item ${currentPage === "sheet-music" ? "active" : ""}`}
                    onClick={() => setCurrentPage("sheet-music")}
                  >
                    Sheet Music Exchange
                  </button>
                  <button
                    className={`nav-item ${currentPage === "lesson-hub" ? "active" : ""}`}
                    onClick={() => setCurrentPage("lesson-hub")}
                  >
                    Lesson Hub
                  </button>
                  <button
                    className={`nav-item ${currentPage === "discussion" ? "active" : ""}`}
                    onClick={() => setCurrentPage("discussion")}
                  >
                    Discussion Forum
                  </button>
                </nav>
              </aside>

              {/* Main Content Area */}
              <main className="main-content">
                {renderPage()}
              </main>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
