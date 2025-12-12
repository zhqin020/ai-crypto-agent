import { useState, useEffect } from 'react';
import { ProfitChart } from './components/ProfitChart';
import { PositionsTab } from './components/PositionsTab';
import { HistoryTab } from './components/HistoryTab';
import { ModelDecisionTab } from './components/ModelDecisionTab';
import { TrendingUp, Wallet, History, Brain, Clock, Activity, Languages } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'decision'>('positions');
  const [runningTime, setRunningTime] = useState({ days: 0, hours: 0 });
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  // 策略实际启动时间（从第一笔交易记录获取）
  const startTime = new Date('2025-11-23T06:58:38').getTime();

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
  }, []);

  const t = {
    zh: {
      title: 'Crypto Quant Dashboard',
      subtitle: `4小时线为基准的AI量化策略，已成功运行 ${runningTime.days} 天 ${runningTime.hours} 小时`,
      profitChart: '📈 收益曲线',
      positions: '当前持仓',
      history: '历史记录',
      decision: '模型决策',
    },
    en: {
      title: 'Crypto Quant Dashboard',
      subtitle: `AI Quant Strategy based on 4H timeframe, running for ${runningTime.days} days ${runningTime.hours} hours`,
      profitChart: '📈 Profit Chart',
      positions: 'Current Positions',
      history: 'Trade History',
      decision: 'Model Decisions',
    },
  };

  return (
    <div className="h-screen bg-[#0a0e1a] text-white p-4">
      <div className="h-full flex flex-col max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-5 flex-shrink-0 pl-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-white text-3xl">
                💎 Crypto <span className="text-blue-400">Quant</span> Dashboard
              </h1>
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-xs uppercase tracking-wider">
                LIVE
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* AI Strategy Notice */}
              <p className="text-gray-400 text-sm">
                {language === 'zh'
                  ? <>4小时线为基准的AI量化策略，已成功运行 <span className="text-blue-400 font-['DIN_Alternate',sans-serif]">{runningTime.days}</span> 天 <span className="text-blue-400 font-['DIN_Alternate',sans-serif]">{runningTime.hours}</span> 小时</>
                  : <>AI Quant Strategy based on 4H timeframe, running for <span className="text-blue-400 font-['DIN_Alternate',sans-serif]">{runningTime.days}</span> days <span className="text-blue-400 font-['DIN_Alternate',sans-serif]">{runningTime.hours}</span> hours</>
                }
              </p>

              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="px-4 py-2 bg-[#374151] rounded-lg hover:bg-[#4b5563] transition-all"
              >
                <span className="text-white">
                  English / 中文
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid - 固定高度 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
          {/* Left: Profit Chart */}
          <div className="bg-[#151b2e] rounded-lg border border-[#1e2942] p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <h2 className="text-white">{t[language].profitChart}</h2>
            </div>
            <div className="flex-1 min-h-0">
              <ProfitChart language={language} />
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="bg-[#151b2e] rounded-lg border border-[#1e2942] flex flex-col h-full overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-[#1e2942] flex-shrink-0">
              <button
                onClick={() => setActiveTab('positions')}
                className={`flex-1 flex items-center justify-center px-6 py-4 transition-all relative font-bold ${activeTab === 'positions'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {activeTab === 'positions' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
                {t[language].positions}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center px-6 py-4 transition-all relative font-bold ${activeTab === 'history'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
                {t[language].history}
              </button>
              <button
                onClick={() => setActiveTab('decision')}
                className={`flex-1 flex items-center justify-center px-6 py-4 transition-all relative font-bold ${activeTab === 'decision'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {activeTab === 'decision' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
                {t[language].decision}
              </button>
            </div>

            {/* Tab Content - 固定高度，内容可滚动 */}
            <div className="p-5 flex-1 overflow-hidden">
              {activeTab === 'positions' ? <PositionsTab language={language} /> : activeTab === 'history' ? <HistoryTab language={language} /> : <ModelDecisionTab language={language} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}