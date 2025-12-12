import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

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
  color: string;
}

const history: HistoryRecord[] = [
  {
    id: '1',
    symbol: 'BTC',
    type: 'long',
    entryPrice: 41000,
    exitPrice: 43500,
    amount: 0.2,
    pnl: 500,
    pnlPercent: 6.1,
    entryTime: '11-20 14:30',
    exitTime: '11-22 09:15',
    color: '#f97316',
  },
  {
    id: '2',
    symbol: 'ETH',
    type: 'long',
    entryPrice: 2180,
    exitPrice: 2100,
    amount: 3,
    pnl: -240,
    pnlPercent: -3.67,
    entryTime: '11-19 08:20',
    exitTime: '11-20 16:45',
    color: '#3b82f6',
  },
  {
    id: '3',
    symbol: 'SOL',
    type: 'long',
    entryPrice: 92,
    exitPrice: 98,
    amount: 20,
    pnl: 120,
    pnlPercent: 6.52,
    entryTime: '11-18 10:00',
    exitTime: '11-19 14:30',
    color: '#10b981',
  },
  {
    id: '4',
    symbol: 'BNB',
    type: 'short',
    entryPrice: 320,
    exitPrice: 305,
    amount: 4,
    pnl: 60,
    pnlPercent: 4.69,
    entryTime: '11-17 15:30',
    exitTime: '11-18 11:20',
    color: '#eab308',
  },
  {
    id: '5',
    symbol: 'DOGE',
    type: 'long',
    entryPrice: 0.075,
    exitPrice: 0.082,
    amount: 6000,
    pnl: 42,
    pnlPercent: 9.33,
    entryTime: '11-16 13:45',
    exitTime: '11-17 10:00',
    color: '#a855f7',
  },
  {
    id: '6',
    symbol: 'ETH',
    type: 'long',
    entryPrice: 2050,
    exitPrice: 2180,
    amount: 2.5,
    pnl: 325,
    pnlPercent: 6.34,
    entryTime: '11-15 09:30',
    exitTime: '11-16 16:20',
    color: '#3b82f6',
  },
  {
    id: '7',
    symbol: 'BTC',
    type: 'long',
    entryPrice: 39500,
    exitPrice: 38800,
    amount: 0.15,
    pnl: -105,
    pnlPercent: -1.77,
    entryTime: '11-14 11:00',
    exitTime: '11-15 08:45',
    color: '#f97316',
  },
  {
    id: '8',
    symbol: 'SOL',
    type: 'short',
    entryPrice: 105,
    exitPrice: 98,
    amount: 15,
    pnl: 105,
    pnlPercent: 6.67,
    entryTime: '11-13 14:20',
    exitTime: '11-14 12:30',
    color: '#10b981',
  },
];

export function HistoryTab({ language }: { language: 'zh' | 'en' }) {
  const totalPnl = history.reduce((sum, record) => sum + record.pnl, 0);
  const winCount = history.filter(r => r.pnl > 0).length;
  const winRate = ((winCount / history.length) * 100).toFixed(1);

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
            className={`bg-[#0a0e1a] rounded-lg overflow-hidden p-3 border-2 border-transparent transition-all ${
              record.pnl >= 0 
                ? 'hover:border-teal-500/30 hover:bg-teal-500/5' 
                : 'hover:border-rose-500/30 hover:bg-rose-500/5'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <span className="text-white font-['DIN_Alternate',sans-serif]">{record.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  record.type === 'long' 
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
                <span className={`px-2 py-1 rounded font-['DIN_Alternate',sans-serif] ${
                  record.pnl >= 0 
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
                <span className="text-white font-['DIN_Alternate',sans-serif]">${record.entryPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">{t[language].exitPrice}: </span>
                <span className="text-white font-['DIN_Alternate',sans-serif]">${record.exitPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="text-gray-500 text-xs">{t[language].amount}: </span>
                <span className="text-white font-['DIN_Alternate',sans-serif]">{record.amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">{t[language].leverage}: </span>
                <span className="text-blue-400 font-['DIN_Alternate',sans-serif]">2.0x</span>
              </div>
            </div>

            {/* 时间 - 移到底部 */}
            <div className="pt-3 border-t border-[#1e2942] flex items-center gap-1 text-gray-500 text-xs">
              <Clock className="w-3 h-3" />
              {record.entryTime} - {record.exitTime}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}