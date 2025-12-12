/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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
  leverage: number;
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
    leverage?: number;
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

export function PositionsTab({ language }: { language: 'zh' | 'en' }) {
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
        // Production: Fetch static JSON file
        const response = await fetch(`/data/portfolio_state.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        state = await response.json();

        if (state) {
          setPortfolioState({ nav: state.nav, cash: state.cash });
          data = (state.positions || []).map(pos => {
            const entryPrice = pos.entry_price;
            const currentPrice = pos.current_price;
            const quantity = pos.quantity;
            let pnl, pnlPercent;

            pnl = (currentPrice - entryPrice) * quantity;
            if (pos.side === 'long') {
              pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
            } else {
              pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
            }

            if (pos.side === 'short') {
              pnl = (entryPrice - currentPrice) * Math.abs(quantity);
            }

            return {
              symbol: pos.symbol,
              name: COIN_NAMES[pos.symbol] || pos.symbol,
              entryPrice: entryPrice || 0,
              currentPrice: currentPrice || 0,
              stopLoss: pos.exit_plan?.stop_loss || 0,
              takeProfit: pos.exit_plan?.take_profit || 0,
              amount: Math.abs(quantity),
              pnl,
              pnlPercent,
              type: pos.side as 'long' | 'short',
              leverage: pos.leverage || 1
            };
          });
        }
      } else {
        // Development: relative path /api/positions via proxy
        const response = await fetch('/api/positions');
        if (!response.ok) throw new Error('Failed to fetch positions');

        const apiData = await response.json();

        if (Array.isArray(apiData)) {
          data = apiData.map((pos: any) => ({
            ...pos,
            // Ensure fallback types
            type: pos.type || (pos.side === 'short' ? 'short' : 'long'),
            leverage: pos.leverage || 1
          }));
        }

        try {
          const navResponse = await fetch('/api/portfolio');
          if (navResponse.ok) {
            const navData = await navResponse.json();
            setPortfolioState({ nav: navData.total_value, cash: navData.cash });
          }
        } catch (e) {
          console.warn(e);
        }
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
    // 只在页面加载时获取一次数据，不自动刷新
  }, []);

  const totalPnl = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const availableCapital = portfolioState?.cash || 0;

  const t = {
    zh: {
      positionPnl: '持仓盈亏',
      availableCapital: '剩余资金',
      position: '持仓',
      long: '做多',
      short: '做空',
      entryPrice: '开仓价',
      currentPrice: '当前价',
      stopLoss: '止损价',
      takeProfit: '止盈价',
      pnl: '盈亏',
    },
    en: {
      positionPnl: 'Position P&L',
      availableCapital: 'Available Capital',
      position: 'Position',
      long: 'Long',
      short: 'Short',
      entryPrice: 'Entry Price',
      currentPrice: 'Current Price',
      stopLoss: 'Stop Loss',
      takeProfit: 'Take Profit',
      pnl: 'P&L',
    },
  };

  // Mock loading state handled by parent or simply just render structure
  if (loading && positions.length === 0) {
    return <div className="text-gray-400 p-4">加载中...</div>;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-rose-500 text-sm flex-col gap-2">
        <div>{error}</div>
        <div className="text-xs text-gray-500">请检查后台服务是否启动 (Port 5001)</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
        <div className="bg-[#0a0e1a] rounded-lg p-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].positionPnl}</div>
          <div className={`flex items-center gap-2 font-['DIN_Alternate',sans-serif] text-2xl ${totalPnl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#0a0e1a] rounded-lg p-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].availableCapital}</div>
          <div className="text-white font-['DIN_Alternate',sans-serif] text-2xl">
            ${availableCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Positions List */}
      <div className="space-y-3 overflow-y-auto pr-2 flex-1">
        {positions.length === 0 ? (
          <div className="text-gray-500 text-center py-10">{language === 'zh' ? '暂无持仓' : 'No open positions'}</div>
        ) : (
          positions.map((position) => (
            <div
              key={position.symbol}
              className={`bg-[#0a0e1a] rounded-lg overflow-hidden transition-all p-4 border-2 border-transparent ${position.pnl >= 0
                ? 'hover:border-teal-500/30 hover:bg-teal-500/5'
                : 'hover:border-rose-500/30 hover:bg-rose-500/5'
                }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-lg font-bold font-['DIN_Alternate',sans-serif]">{position.symbol}</span>
                    <span className="text-gray-500 text-sm">{position.name}</span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {t[language].position}: <span className="text-white font-['DIN_Alternate',sans-serif]">{position.amount} {position.symbol}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-sm font-['DIN_Alternate',sans-serif] ${position.type === 'short'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                    {position.leverage}x {position.type === 'short' ? t[language].short : t[language].long}
                  </span>
                </div>
              </div>

              {/* Price Info grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">{t[language].entryPrice}</div>
                    <div className="text-white font-['DIN_Alternate',sans-serif]">
                      ${position.entryPrice.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                      <ArrowDownCircle className="w-3 h-3 text-rose-400" />
                      {t[language].stopLoss}
                    </div>
                    <div className="text-rose-400 font-['DIN_Alternate',sans-serif]">
                      ${position.stopLoss.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">{t[language].currentPrice}</div>
                    <div className="text-white font-['DIN_Alternate',sans-serif]">
                      ${position.currentPrice.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                      <ArrowUpCircle className="w-3 h-3 text-teal-400" />
                      {t[language].takeProfit}
                    </div>
                    <div className="text-teal-400 font-['DIN_Alternate',sans-serif]">
                      ${position.takeProfit.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* PnL Footer */}
              <div className="pt-3 border-t border-[#1e2942] flex justify-between items-center">
                <div className="text-gray-400 text-sm">{t[language].pnl}</div>
                <div className="flex items-center gap-3">
                  <span className={`font-['DIN_Alternate',sans-serif] text-lg ${position.pnl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                    {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                  </span>
                  <span className={`px-2 py-1 rounded font-['DIN_Alternate',sans-serif] ${position.pnl >= 0
                    ? 'text-teal-400 bg-teal-400/10'
                    : 'text-rose-400 bg-rose-400/10'
                    }`}>
                    {position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}