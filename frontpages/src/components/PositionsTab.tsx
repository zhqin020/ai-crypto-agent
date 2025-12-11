/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

interface Position {
  symbol: string;
  name: string;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  type: 'long' | 'short';
}

interface PortfolioState {
  nav: number;
  cash: number;
  positions: {
    symbol: string;
    entry_price: number;
    current_price: number;
    quantity: number;
    side: string;
    exit_plan: {
      stop_loss: number;
      take_profit: number;
    };
  }[];
}

const COIN_NAMES: Record<string, string> = {
  "BTC": "Bitcoin",
  "ETH": "Ethereum",
  "SOL": "Solana",
  "BNB": "BNB",
  "DOGE": "Dogecoin"
};

export function PositionsTab() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioState, setPortfolioState] = useState<{ nav: number, cash: number } | null>(null);

  const fetchPositions = async () => {
    try {
      setLoading(true);

      let data: Position[] = [];
      let state: PortfolioState | null = null;

      if (import.meta.env.MODE === 'production') {
        // Fetch from static file in production
        const response = await fetch('/data/portfolio_state.json');
        if (!response.ok) throw new Error('Failed to fetch data');
        state = await response.json();
      } else {
        // Fetch from API in development
        const response = await fetch('http://localhost:5001/api/positions');
        if (!response.ok) throw new Error('Failed to fetch positions');
        state = await response.json();
      }

      if (state) {
        setPortfolioState({ nav: state.nav, cash: state.cash });

        // Transform raw state to Position interface
        data = (state.positions || []).map(pos => {
          const entryPrice = pos.entry_price;
          const currentPrice = pos.current_price;
          const quantity = pos.quantity;
          let pnl, pnlPercent;

          // Unified PnL formula since quantity is signed (+ for long, - for short)
          pnl = (currentPrice - entryPrice) * quantity;

          // PnL Percent
          if (pos.side === 'long') {
            pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
          } else {
            // For short: (Entry - Current) / Entry * 100
            pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
          }

          return {
            symbol: pos.symbol,
            name: COIN_NAMES[pos.symbol] || pos.symbol,
            entryPrice: entryPrice || 0,
            currentPrice: currentPrice || 0,
            stopLoss: pos.exit_plan?.stop_loss || 0,
            takeProfit: pos.exit_plan?.take_profit || 0,
            amount: quantity,
            pnl,
            pnlPercent,
            type: pos.side as 'long' | 'short'
          };
        });
      }

      setPositions(data);
      setError(null);
    } catch (err) {
      console.error(err);
      if (positions.length === 0) {
        setError('无法连接到数据源');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalPnl = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const availableCapital = portfolioState?.cash || 0;

  if (loading && positions.length === 0) {
    return <div className="text-gray-400 p-4">加载中...</div>;
  }

  if (error && positions.length === 0) {
    return (
      <div className="text-red-400 p-4 border border-red-500/20 rounded bg-red-500/10">
        {error}
        <button onClick={fetchPositions} className="ml-4 underline">重试</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
        <div className="bg-[#1e293b] rounded-lg p-3 border border-gray-700/50">
          <div className="text-gray-400 text-sm mb-1">持仓盈亏</div>
          <div className={`flex items-center gap-1 font-['DIN_Alternate',sans-serif] ${totalPnl >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-lg p-3 border border-gray-700/50">
          <div className="text-gray-400 text-sm mb-1">剩余资金</div>
          <div className="text-white font-['DIN_Alternate',sans-serif]">
            ${availableCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Positions List */}
      <div className="space-y-3 overflow-y-auto pr-2 flex-1">
        {positions.length === 0 ? (
          <div className="text-gray-500 text-center py-8">暂无持仓</div>
        ) : (
          positions.map((position) => {
            const entryPrice = position.entryPrice || 0;
            const currentPrice = position.currentPrice || 0;
            const stopLoss = position.stopLoss || 0;
            const takeProfit = position.takeProfit || 0;
            const pnl = position.pnl || 0;
            const pnlPercent = position.pnlPercent || 0;

            return (
              <div
                key={position.symbol}
                className="bg-dark-card border border-dark-card/80 rounded-xl p-4 hover:border-gray-600 transition-all"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-neon-cyan font-bold text-lg">{position.symbol}</div>
                    <span className="text-gray-500 text-sm">{position.name}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-400 text-sm">持仓:</span>
                      <span className="text-white text-sm font-['DIN_Alternate',sans-serif]">
                        {position.amount} {position.symbol}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-sm font-['DIN_Alternate',sans-serif] ${position.type === 'short'
                      ? 'bg-neon-rose/10 text-neon-rose'
                      : 'bg-neon-green/10 text-neon-green'
                      }`}>
                      {position.type === 'short' ? '做空' : '做多'}
                    </div>
                  </div>
                </div>

                {/* Price Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">开仓价</div>
                    <div className="text-neon-cyan font-['DIN_Alternate',sans-serif]">{position.entryPrice ? `$${position.entryPrice.toFixed(2)}` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">当前价</div>
                    <div className="text-white font-['DIN_Alternate',sans-serif]">${currentPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <ArrowDownCircle className="w-3 h-3" />
                      止损价
                    </div>
                    <div className="text-red-400 font-['DIN_Alternate',sans-serif]">${stopLoss.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3" />
                      止盈价
                    </div>
                    <div className="text-neon-cyan font-['DIN_Alternate',sans-serif]">${takeProfit.toLocaleString()}</div>
                  </div>
                </div>

                {/* PnL */}
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">盈亏</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-['DIN_Alternate',sans-serif] ${pnl >= 0 ? 'text-neon-green' : 'text-neon-rose'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-['DIN_Alternate',sans-serif] ${pnl >= 0
                        ? 'bg-neon-green/10 text-neon-green'
                        : 'bg-neon-rose/10 text-neon-rose'
                        }`}>
                        {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}