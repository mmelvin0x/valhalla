export default function HowItWorksSection() {
  return (
    <div className="how-it-works py-10 bg-base-100">
      <div className="container mx-auto">
        <h2 className="degen-locker mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-xl mb-2">1: Connect Wallet</h3>
              <p className="prose">
                Sign up on Valhalla with your wallet. Our platform supports
                various wallets for easy integration with the Solana ecosystem.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-xl mb-2">2: Select a Token</h3>
              <p className="prose">
                Choose the LP tokens you want to lock. Our platform provides
                real-time data to help you make informed decisions.
              </p>
            </div>
          </div>
          {/* Step 3 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-xl mb-2">3: Lock Your Tokens</h3>
              <p className="prose">
                Lock your selected LP tokens. This action secures your tokens
                and starts generating rewards.
              </p>
            </div>
          </div>
          {/* Step 4 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-xl mb-2">4: Monitor Rewards</h3>
              <p className="prose">
                Watch your investments grow. Our dashboard provides
                comprehensive monitoring tools and reports on your earnings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
