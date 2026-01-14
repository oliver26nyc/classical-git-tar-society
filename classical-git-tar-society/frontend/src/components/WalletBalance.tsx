import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

// Replace this with your actual TAR token mint address
const TAR_MINT_ADDRESS = new PublicKey("FD2ZQ6SJxQTFo4FfvXEy6Jiw9MA3KkXXdo39THCEe6iH");

export const TokenBalance = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setBalance(null);
        return;
      }

      setLoading(true);
      try {
        // Derive the associated token account address
        const [tokenAccountAddress] = await PublicKey.findProgramAddress(
          [
            publicKey.toBuffer(),
            new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
            TAR_MINT_ADDRESS.toBuffer(),
          ],
          new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
        );

        // Fetch the token account
        const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
        
        if (accountInfo && accountInfo.data.length > 0) {
          // Parse token account data (layout: amount is at bytes 64-72 as u64)
          const data = accountInfo.data;
          const amountBytes = data.slice(64, 72);
          const amount = amountBytes.readBigUInt64LE(0);
          
          // Convert balance (assuming 9 decimals - adjust if your token has different decimals)
          const balanceAmount = Number(amount) / 1_000_000_000;
          setBalance(balanceAmount);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.log("Error fetching token balance:", error);
        setBalance(0);
      }
      setLoading(false);
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  if (!publicKey) {
    return null; // Don't show anything if wallet not connected
  }

  return (
    <div className="balance-display">
      {loading ? (
        <span>Loading...</span>
      ) : (
        <span className="tar-balance">
          🪙 {balance !== null ? balance.toFixed(2) : "0.00"} TAR
        </span>
      )}
    </div>
  );
};
