import { useState, useEffect } from 'react';
import { ProfitChart } from './components/ProfitChart';
import { PositionsTab } from './components/PositionsTab';
import { HistoryTab } from './components/HistoryTab';
import { ModelDecisionTab } from './components/ModelDecisionTab';
import { TrendingUp, Wallet, History, Brain, Clock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'decision'>('positions');
  const [runningTime, setRunningTime] = useState({ days: 0, hours: 0 });

  const [startTime, setStartTime] = useState<number>(new Date('2025-11-23T00:00:00').getTime());

  useEffect(() => {
    const fetchStartTime = async () => {
      try {
        let startTimeStr: string | null = null;

        if (import.meta.env.MODE === 'production') {
          // In production, read from static CSV file
          const response = await fetch('/data/nav_history.csv');
          if (response.ok) {
            const text = await response.text();
            const lines = text.split('\n');
            // Line 0 is header, Line 1 is the first data point
            if (lines.length > 1) {
              const firstLine = lines[1];
              if (firstLine) {
                startTimeStr = firstLine.split(',')[0];
              }
            }
          }
        } else {
          // In development, use the API
          const response = await fetch('http://localhost:5001/api/summary');
          if (response.ok) {
            const data = await response.json();
            if (data.startTime) {
              startTimeStr = data.startTime;
            }
          }
        }

        if (startTimeStr) {
          // Ensure format is compatible with Date constructor (replace space with T)
          const timeStr = startTimeStr.replace(' ', 'T');
          setStartTime(new Date(timeStr).getTime());
        }
      } catch (error) {
        console.error("Failed to fetch start time:", error);
      }
    };

    fetchStartTime();
  }, []);

  useEffect(() => {
    const updateRunningTime = () => {
      const now = Date.now();
      const diff = now - startTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setRunningTime({ days, hours });
    };

    updateRunningTime();
    const interval = setInterval(updateRunningTime, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="h-screen bg-dark-primary text-slate-100 p-3">
      <div className="h-full flex flex-col max-w-[1800px] mx-auto w-full">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <h1 className="flex items-baseline gap-3 text-5xl">
                <span className="text-white">Crypto</span>
                <span className="text-blue-400">Quant</span>
                <span className="text-white">Dashboard</span>
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400 text-base">
                  4小时线为基准的AI量化策略，已成功运行
                  <span className="text-blue-400 font-['DIN_Alternate',sans-serif] mx-1.5">
                    {runningTime.days}
                  </span>
                  天
                  <span className="text-blue-400 font-['DIN_Alternate',sans-serif] mx-1.5">
                    {runningTime.hours}
                  </span>
                  小时
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid - 固定高度 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left: Profit Chart */}
          <div className="bg-[#334155] rounded-xl border border-gray-700 p-6 shadow-2xl flex flex-col h-full">
            <h2 className="text-blue-400 mb-4 flex items-center gap-2 flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
              收益曲线
            </h2>
            <div className="flex-1 overflow-hidden">
              <ProfitChart />
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="bg-[#334155] rounded-xl border border-gray-700 shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-700 flex-shrink-0">
              <button
                onClick={() => setActiveTab('positions')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${activeTab === 'positions'
                  ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                  }`}
              >
                <Wallet className="w-4 h-4" />
                当前持仓
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${activeTab === 'history'
                  ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                  }`}
              >
                <History className="w-4 h-4" />
                历史记录
              </button>
              <button
                onClick={() => setActiveTab('decision')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${activeTab === 'decision'
                  ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                  }`}
              >
                <Brain className="w-4 h-4" />
                模型决策
              </button>
            </div>

            {/* Tab Content - 固定高度，内容可滚动 */}
            <div className="p-6 flex-1 overflow-hidden">
              {activeTab === 'positions' ? <PositionsTab /> : activeTab === 'history' ? <HistoryTab /> : <ModelDecisionTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}