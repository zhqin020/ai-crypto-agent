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
  type?: 'short';
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rsi?: number;
  color: string; // 主题色
  leverage: number; // 杠杆倍数
}

const positions: Position[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    entryPrice: 42500,
    currentPrice: 44200,
    stopLoss: 40000,
    takeProfit: 48000,
    amount: 0.15,
    pnl: 255,
    pnlPercent: 4.0,
    sentiment: 'NEUTRAL',
    rsi: 55.4,
    color: '#f97316', // orange-500
    leverage: 3,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    entryPrice: 2250,
    currentPrice: 2420,
    stopLoss: 2100,
    takeProfit: 2600,
    amount: 2.5,
    pnl: 425,
    pnlPercent: 7.56,
    sentiment: 'BULLISH',
    rsi: 71.6,
    color: '#3b82f6', // blue-500
    leverage: 5,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    entryPrice: 98.5,
    currentPrice: 95.2,
    stopLoss: 90,
    takeProfit: 110,
    amount: 15,
    pnl: -49.5,
    pnlPercent: -3.35,
    sentiment: 'BEARISH',
    rsi: 50.5,
    color: '#10b981', // green-500
    leverage: 2,
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    entryPrice: 310,
    currentPrice: 305,
    stopLoss: 290,
    takeProfit: 320,
    amount: 5,
    pnl: -25,
    pnlPercent: -1.61,
    type: 'short',
    sentiment: 'BEARISH',
    rsi: 51.7,
    color: '#eab308', // yellow-500
    leverage: 3,
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    entryPrice: 0.082,
    currentPrice: 0.089,
    stopLoss: 0.075,
    takeProfit: 0.095,
    amount: 5000,
    pnl: 35,
    pnlPercent: 8.54,
    sentiment: 'BEARISH',
    rsi: 55.2,
    color: '#a855f7', // purple-500
    leverage: 2,
  },
];

export function PositionsTab({ language }: { language: 'zh' | 'en' }) {
  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  // 计算已使用资金（基于开仓价）
  const usedCapital = positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.amount), 0);
  const initialCapital = 10000;
  const availableCapital = initialCapital + totalPnl - usedCapital;

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return 'text-teal-400';
      case 'BEARISH':
        return 'text-rose-400';
      case 'NEUTRAL':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

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
            ${availableCapital.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Positions List */}
      <div className="space-y-3 overflow-y-auto pr-2 flex-1">
        {positions.map((position) => (
          <div
            key={position.symbol}
            className={`bg-[#0a0e1a] rounded-lg overflow-hidden transition-all p-4 border-2 border-transparent ${
              position.pnl >= 0 
                ? 'hover:border-teal-500/30 hover:bg-teal-500/5' 
                : 'hover:border-rose-500/30 hover:bg-rose-500/5'
            }`}
          >
            {/* Header - 币种、持仓量和杠杆 */}
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
                <span className={`px-2 py-1 rounded text-sm font-['DIN_Alternate',sans-serif] ${
                  position.type === 'short'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {position.leverage}x {position.type === 'short' ? t[language].short : t[language].long}
                </span>
              </div>
            </div>

            {/* 中部 - 左右两列：开仓价/止损价 vs 当前价/止盈价 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* 左列 */}
              <div className="space-y-3">
                {/* 开仓价 */}
                <div>
                  <div className="text-gray-500 text-xs mb-1">{t[language].entryPrice}</div>
                  <div className="text-white font-['DIN_Alternate',sans-serif]">
                    ${position.entryPrice.toLocaleString()}
                  </div>
                </div>
                {/* 止损价 */}
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

              {/* 右列 */}
              <div className="space-y-3">
                {/* 当前价 */}
                <div>
                  <div className="text-gray-500 text-xs mb-1">{t[language].currentPrice}</div>
                  <div className="text-white font-['DIN_Alternate',sans-serif]">
                    ${position.currentPrice.toLocaleString()}
                  </div>
                </div>
                {/* 止盈价 */}
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

            {/* 底部 - 盈亏 */}
            <div className="pt-3 border-t border-[#1e2942] flex justify-between items-center">
              <div className="text-gray-400 text-sm">{t[language].pnl}</div>
              <div className="flex items-center gap-3">
                <span className={`font-['DIN_Alternate',sans-serif] text-lg ${position.pnl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                </span>
                <span className={`px-2 py-1 rounded font-['DIN_Alternate',sans-serif] ${
                  position.pnl >= 0 
                    ? 'text-teal-400 bg-teal-400/10' 
                    : 'text-rose-400 bg-rose-400/10'
                }`}>
                  {position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}