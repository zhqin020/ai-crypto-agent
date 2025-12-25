/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, History } from 'lucide-react';

interface HistoryRecord {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  entryTime: string;
  exitTime: string;
  leverage: number;
  notional: number;
}

export function HistoryTab({ language }: { language: 'zh' | 'en' }) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      if (import.meta.env.MODE === 'production') {
        try {
          const response = await fetch(`/data/trade_log.csv?t=${Date.now()}`);
          if (response.ok) {
            const text = await response.text();
            const lines = text.trim().split('\n');
            const parsedHistory: HistoryRecord[] = [];

            const openPositions: Record<string, { entryTime: string, entryPrice: number, qty: number, notional: number, margin: number, leverage: number }[]> = {};

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;

              const fields = line.split(',');
              const time = fields[0];
              const symbol = fields[1];
              const action = fields[2];
              const side = fields[3];
              const qty = fields[4];
              const price = fields[5];
              const notional = fields[6];
              const margin = fields[7];
              const fee = fields[8];
              const realized_pnl = fields[9];
              const leverage = fields.length > 12 ? fields[12] : null;

              if (action === 'open_long' || action === 'open_short' || action === 'open_long_merge' || action === 'open_short_merge') { // handle merge types too
                if (!openPositions[symbol]) openPositions[symbol] = [];
                openPositions[symbol].push({
                  entryTime: time,
                  entryPrice: parseFloat(price),
                  qty: parseFloat(qty),
                  notional: parseFloat(notional),
                  margin: parseFloat(margin),
                  leverage: leverage ? parseFloat(leverage) : (parseFloat(notional) / parseFloat(margin))
                });

              } else if (action === 'close_position') {
                const exitPrice = parseFloat(price);
                const quantity = parseFloat(qty);
                const pnlVal = parseFloat(realized_pnl);
                const feeVal = parseFloat(fee);
                const rawPnl = pnlVal + feeVal;


                const openInfos = openPositions[symbol] || [];
                let entryPrice = 0;
                let entryTime = 'Unknown';
                let matchedIndex = -1;
                let openInfo = null;

                // 1. Try to find exact quantity match (within small epsilon)
                matchedIndex = openInfos.findIndex(p => Math.abs(p.qty - quantity) < 0.0001);

                // 2. If no exact match, try to find "contained" match (open qty >= close qty) - simple FIFO for now
                if (matchedIndex === -1 && openInfos.length > 0) {
                  matchedIndex = 0; // Fallback to FIFO
                }

                if (matchedIndex !== -1) {
                  openInfo = openInfos[matchedIndex];
                  entryPrice = openInfo.entryPrice;
                  entryTime = openInfo.entryTime;

                  // Remove the matched position
                  openInfos.splice(matchedIndex, 1);
                } else {
                  if (side === 'long') {
                    entryPrice = exitPrice - (rawPnl / quantity);
                  } else {
                    entryPrice = exitPrice + (rawPnl / quantity);
                  }
                }

                const pnlPercent = (rawPnl / (parseFloat(margin) || (entryPrice * quantity / 2) || 1)) * 100;
                const leverageVal = openInfo?.leverage || (leverage ? parseFloat(leverage) : ((parseFloat(notional) || 0) / (parseFloat(margin) || 1)));
                const notionalVal = openInfo?.notional || parseFloat(notional) || 0;

                parsedHistory.push({
                  id: `${time}-${symbol}-${Math.random()}`,
                  symbol: symbol,
                  type: side as 'long' | 'short',
                  entryPrice: entryPrice || 0,
                  exitPrice: exitPrice || 0,
                  amount: quantity || 0,
                  pnl: pnlVal || 0,
                  pnlPercent: pnlPercent || 0,
                  entryTime: entryTime || 'Unknown',
                  exitTime: time,
                  leverage: leverageVal || 1,
                  notional: notionalVal
                });
              }
            }
            parsedHistory.sort((a, b) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime());
            setHistory(parsedHistory);
          } else {
            setHistory([]);
          }
        } catch (e) {
          console.error("Failed to load history CSV", e);
          setHistory([]);
        }
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('无法连接到交易服务器');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalPnl = history.reduce((sum, record) => sum + record.pnl, 0);
  const winCount = history.filter(r => r.pnl > 0).length;
  const winRate = history.length > 0 ? ((winCount / history.length) * 100).toFixed(1) : '0.0';

  const t = {
    zh: {
      totalPnl: '总盈亏',
      winRate: '胜率',
      tradeCount: '交易次数',
      long: '做多',
      short: '做空',
      entryPrice: '开仓',
      exitPrice: '平仓',
      amount: '数量',
      leverage: '杠杆',
      pnl: '盈亏',
    },
    en: {
      totalPnl: 'Total P&L',
      winRate: 'Win Rate',
      tradeCount: 'Trades',
      long: 'Long',
      short: 'Short',
      entryPrice: 'Entry',
      exitPrice: 'Exit',
      amount: 'Amount',
      leverage: 'Leverage',
      pnl: 'P&L',
    },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
        <div className="bg-[#0a0e1a] rounded-lg p-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].totalPnl}</div>
          <div className={`font-['DIN_Alternate',sans-serif] text-2xl ${totalPnl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
          </div>
        </div>
        <div className="bg-[#0a0e1a] rounded-lg p-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].winRate}</div>
          <div className="text-teal-400 font-['DIN_Alternate',sans-serif] text-2xl">{winRate}%</div>
        </div>
        <div className="bg-[#0a0e1a] rounded-lg p-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].tradeCount}</div>
          <div className="text-white font-['DIN_Alternate',sans-serif] text-2xl">{history.length}</div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2 overflow-y-auto pr-2 flex-1">
        {history.map((record) => (
          <div
            key={record.id}
            className={`bg-[#0a0e1a] rounded-lg overflow-hidden p-3 border-2 border-transparent transition-all ${record.pnl >= 0
              ? 'hover:border-teal-500/30 hover:bg-teal-500/5'
              : 'hover:border-rose-500/30 hover:bg-rose-500/5'
              }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <span className="text-white font-['DIN_Alternate',sans-serif]">{record.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${record.type === 'long'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-orange-500/20 text-orange-400'
                  }`}>
                  {record.type === 'long' ? t[language].long : t[language].short}
                </span>
              </div>

              {/* 盈亏 - 移到右上角 */}
              <div className="flex items-center gap-2">
                <span className={`font-['DIN_Alternate',sans-serif] text-lg ${record.pnl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {record.pnl >= 0 ? '+' : ''}${record.pnl.toFixed(2)}
                </span>
                <span className={`px-2 py-1 rounded font-['DIN_Alternate',sans-serif] ${record.pnl >= 0
                  ? 'text-teal-400 bg-teal-400/10'
                  : 'text-rose-400 bg-rose-400/10'
                  }`}>
                  {record.pnl >= 0 ? '+' : ''}{record.pnlPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="text-gray-500 text-xs">{t[language].entryPrice}: </span>
                <span className="text-white font-['DIN_Alternate',sans-serif]">${record.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">{t[language].exitPrice}: </span>
                <span className="text-white font-['DIN_Alternate',sans-serif]">${record.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="text-gray-500 text-xs">{t[language].amount}: </span>
                <span className="text-white font-['DIN_Alternate',sans-serif]">{record.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">{t[language].leverage}: </span>
                <span className="text-blue-400 font-['DIN_Alternate',sans-serif]">{record.leverage.toFixed(1)}x</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e2942] flex items-center gap-1 text-gray-500 text-xs">
              <Clock className="w-3 h-3" />
              {record.entryTime} - {record.exitTime}
            </div>
          </div>
        ))}
        {history.length === 0 && !loading && (
          <div className="text-gray-500 text-center py-10">{language === 'zh' ? '暂无交易记录' : 'No trade history'}</div>
        )}
      </div>
    </div>
  );
}