import { Brain, TrendingUp, AlertTriangle, Target, Activity, XCircle, PlusCircle, MinusCircle } from 'lucide-react';

interface DecisionAction {
  symbol: string;
  action: string;
  leverage: string;
  positionSize: number;
  reasoning: string;
  takeProfit: number;
  stopLoss: number;
  rejectionReason?: string; // 新增：拒绝原因
}

const latestDecision = {
  timestamp: '2025-12-12 16:17:01',
  marketAnalysis: `【叙事投资】宏观新闻显示美联储降息预期升温（隐含利率下降15.2基点）和住房数据疲软，但市场已部分消化（恐惧贪婪指数29，处于恐慌区），属于Priced In非利空驱动。2. 日线趋势上所有主要币种均处于手续费风险（价格低于SMA50），结合资金费率数据，BNB和SOL存在盘整走风险（费率偏高），而ETH存在盘整机会（负费率-0.0031%）。3. 我选择【微观结构预测】卧本，利用ETH的负费率（拥挤空头）和价格惯性（RSI中性）进行做多，同时持有BNB和SOL头寸（它们仍有积极趋势度）。`,
  actions: [
    {
      symbol: 'BNB',
      action: 'hold',
      leverage: '2x',
      positionSize: 4312.28,
      reasoning: '持有现有头寸，BNB Qlib评分高（0.3488），排名第一，动量为正（0.0026），资金费率略高但未到危险水平（0.0047%），且趋势尚未破坏4H结构稳定。',
      takeProfit: 920,
      stopLoss: 840,
    },
    {
      symbol: 'SOL',
      action: 'hold',
      leverage: '2x',
      positionSize: 1118.12,
      reasoning: '合并持有两个SOL头寸，SOL Qlib评分第三（0.2536），动量为正（0.0129），但资金费率偏高（0.0100%），存在轧多风险，不过价格在支撑上方且日评分尚可，暂持有。',
      takeProfit: 138,
      stopLoss: 125,
    },
    {
      symbol: 'ETH',
      action: 'rejected',
      leverage: '2x',
      positionSize: 1000,
      reasoning: '符合【微观结构预测】剧本，ETH资金费率为负（-0.0031%），Z-Score极低（-141.9%），显示拥挤空头，存在轧空机会；Qlib评分第二（0.306），日线趋势尚属4H RSI中性（54.43），价格有韧性。',
      takeProfit: 3400,
      stopLoss: 3150,
      rejectionReason: 'Position Limit Exceeded (Max 3)',
    },
  ],
};

const historicalDecisions = [
  {
    timestamp: '2025-12-11 08:43:15',
    isLatest: false,
    marketAnalysis: `市场迎来转折，BTC突破91000美元关键阻力位，成交量放大，技术指标显示多头强势。ETH跟随上涨，RSI进入超买区域但动能未衰竭。资金费率转正，显示多头情绪升温。`,
    actions: [
      {
        symbol: 'BTC',
        action: 'open',
        leverage: '3x',
        positionSize: 5000,
        reasoning: 'BTC突破关键阻力位91000，MACD金叉，RSI 68显示强势但未过热。资金费率转正至0.0025%，多头氛围浓厚。Qlib评分0.4521排名第一，符合趋势跟踪策略。',
        takeProfit: 95000,
        stopLoss: 89000,
      },
    ],
  },
  {
    timestamp: '2025-12-01 14:15:22',
    isLatest: false,
    marketAnalysis: `市场情绪偏谨慎，BTC在89000附近震荡，ETH表现相对强势。资金费率整体偏负，显示做空情绪较浓。技术面上，主流币种RSI处于中性区域，MACD呈现弱势信号。`,
    actions: [
      {
        symbol: 'SOL',
        action: 'close',
        leverage: '3x',
        positionSize: 2000,
        reasoning: '已达到止盈目标，技术指标显示短期超买，选择获利了结。',
        takeProfit: 110,
        stopLoss: 95,
      },
    ],
  },
];

export function ModelDecisionTab({ language }: { language: 'zh' | 'en' }) {
  const allDecisions = [latestDecision, ...historicalDecisions];

  const t = {
    zh: {
      marketAnalysis: '📊 市场分析',
      actions: '⚡ 执行动作',
      positionLabel: '仓位',
      reasoning: '决策逻辑',
      takeProfit: '止盈价',
      stopLoss: '止损价',
      rejected: '已拒绝',
      rejectionReason: '拒绝原因',
      open: '开仓',
      close: '平仓',
    },
    en: {
      marketAnalysis: '📊 Market Analysis',
      actions: '⚡ Actions',
      positionLabel: 'Position',
      reasoning: 'Reasoning',
      takeProfit: 'Take Profit',
      stopLoss: 'Stop Loss',
      rejected: 'Rejected',
      rejectionReason: 'Rejection Reason',
      open: 'Open',
      close: 'Close',
    },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="space-y-8 overflow-y-auto pr-2 flex-1">
        {allDecisions.map((decision, index) => (
          <div key={decision.timestamp}>
            {/* Timestamp Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <div className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30 uppercase tracking-wider animate-pulse">
                    LATEST
                  </div>
                )}
                {index !== 0 && (
                  <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                )}
                <span className={`font-['DIN_Alternate',sans-serif] text-sm ${index === 0 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {decision.timestamp}
                </span>
              </div>
            </div>

            {/* Market Analysis */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-white">{t[language].marketAnalysis}</h3>
              </div>
              <div className="bg-[#0a0e1a] rounded-lg p-5 border border-[#1e2942]">
                <p className="text-gray-400 leading-relaxed text-sm">
                  {decision.marketAnalysis}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-white">{t[language].actions} ({decision.actions.length})</h3>
              </div>

              <div className="space-y-4">
                {decision.actions.map((action) => (
                  <div
                    key={action.symbol}
                    className="bg-[#0a0e1a] rounded-lg border border-[#1e2942] overflow-hidden hover:border-opacity-60 transition-all p-5"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-white font-['DIN_Alternate',sans-serif] text-lg">{action.symbol}</div>
                        {action.action === 'rejected' ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded uppercase border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>{t[language].rejected}</span>
                          </div>
                        ) : action.action === 'open' ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded uppercase border border-emerald-500/30">
                            <PlusCircle className="w-3 h-3" />
                            <span>{t[language].open}</span>
                          </div>
                        ) : action.action === 'close' ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded uppercase border border-rose-500/30">
                            <MinusCircle className="w-3 h-3" />
                            <span>{t[language].close}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-[#151b2e] text-gray-300 text-xs rounded uppercase border border-[#1e2942]">
                            {action.action}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-['DIN_Alternate',sans-serif] border border-blue-500/30">
                          {action.leverage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">{t[language].positionLabel}:</span>
                        <span className="text-white text-sm font-['DIN_Alternate',sans-serif]">
                          ${action.positionSize.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="mb-4">
                      <div className="text-gray-500 text-xs mb-2">{t[language].reasoning}</div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {action.reasoning}
                      </p>
                    </div>

                    {/* TP & SL */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-500 text-xs">{t[language].takeProfit}: </span>
                        <span className="text-teal-400 font-['DIN_Alternate',sans-serif]">
                          ${action.takeProfit.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">{t[language].stopLoss}: </span>
                        <span className="text-rose-400 font-['DIN_Alternate',sans-serif]">
                          ${action.stopLoss.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {action.rejectionReason && (
                      <div className="mt-4">
                        <div className="text-gray-500 text-xs mb-2">{t[language].rejectionReason}</div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {action.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}