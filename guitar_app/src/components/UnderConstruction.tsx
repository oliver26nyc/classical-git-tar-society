export const UnderConstruction = ({ pageName, tokenRule }: { pageName: string; tokenRule: string }) => {
  return (
    <div className="under-construction">
      <h2>🚧 {pageName} 🚧</h2>
      <p>This page is currently under construction.</p>
      <p>Check back soon for updates!</p>
      
      <div className="token-rewards-box">
        <h3>🪙 PEG Token Rewards</h3>
        <p className="token-rule">{tokenRule}</p>
      </div>
    </div>
  );
};
