/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { Brain, Activity } from 'lucide-react';

type BilingualText = string | { zh: string; en: string };

interface AgentAction {
  symbol: string;
  action: string;
  leverage: number | null;
  position_size_usd: number | null;
  entry_reason: BilingualText | null;
  exit_plan: {
    take_profit?: number | null;
    stop_loss?: number | null;
    invalidation?: BilingualText | null;
  };
  status?: string;
  rejection_reason?: string;
}

interface AgentDecision {
  analysis_summary: BilingualText;
  actions: AgentAction[];
  timestamp?: string;
}

export function ModelDecisionTab({ language }: { language: 'zh' | 'en' }) {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getText = (content: BilingualText | null | undefined, lang: 'zh' | 'en') => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return content[lang] || content['zh'] || '';
  };

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        let data: AgentDecision | AgentDecision[];

        if (import.meta.env.MODE === 'production') {
          const response = await fetch(`/data/agent_decision_log.json?t=${Date.now()}`);
          if (!response.ok) throw new Error('Failed to fetch agent log');
          data = await response.json();
        } else {
          const response = await fetch('/api/agent-decision');
          if (!response.ok) throw new Error('Failed to fetch agent log');
          data = await response.json();
        }

        if (Array.isArray(data)) {
          setDecisions(data);
        } else if (data) {
          setDecisions([data]);
        } else {
          setDecisions([]);
        }
        setError(null);
      } catch (err) {
        console.error(err);
        setError('无法加载模型决策日志');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
    const interval = setInterval(fetchLog, 10000);
    return () => clearInterval(interval);
  }, []);

  const t = {
    zh: {
      marketAnalysis: '📊 市场分析',
      actions: '⚡ 执行动作',
      positionLabel: '仓位',
      entryReason: '入场原因',
      takeProfit: '止盈',
      stopLoss: '止损',
      reasoning: '决策逻辑',
      noActions: '暂无新操作 (维持现状)',
      latest: '最新',
      unknownTime: '未知时间',
      noDecisions: '暂无决策记录',
      unknown: '未知',
      rejected: '❌ 已拒绝 (Rejected)',
      rejectionReason: '拒绝原因 (Rejection Reason)',
      invalidation: '失效条件',
    },
    en: {
      latest: 'LATEST',
      marketAnalysis: '📊 Market Analysis',
      actions: '⚡ Actions',
      positionLabel: 'Size',
      entryReason: 'Entry Reason',
      takeProfit: 'Take Profit',
      stopLoss: 'Stop Loss',
      reasoning: 'Reasoning',
      noActions: 'No new actions taken (Hold)',
      unknownTime: 'Unknown Time',
      noDecisions: 'No decisions found',
      unknown: 'UNKNOWN',
      rejected: '❌ Rejected',
      rejectionReason: 'Rejection Reason',
      invalidation: 'Invalidation',
    },
  };

  if (loading && decisions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <Activity className="w-8 h-8 animate-pulse text-teal-400" />
          <div className="text-xs font-['DIN_Alternate',sans-serif]">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
        </div>
      </div>
    );
  }

  if (error && decisions.length === 0) {
    return <div className="h-full flex items-center justify-center text-rose-500 text-sm">{error}</div>;
  }

  if (decisions.length === 0) return <div className="text-gray-500 p-4">{t[language].noDecisions}</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-8 overflow-y-auto pr-2 flex-1">
        {decisions.map((decision, index) => (
          <div key={index}>
            {/* Timestamp Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <div className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30 uppercase tracking-wider animate-pulse">
                    {t[language].latest}
                  </div>
                )}
                {index !== 0 && (
                  <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                )}
                <span className={`font-['DIN_Alternate',sans-serif] text-sm ${index === 0 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {decision.timestamp || t[language].unknownTime}
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
                  {getText(decision.analysis_summary, language)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-white">{t[language].actions} ({decision.actions?.length || 0})</h3>
              </div>

              <div className="space-y-4">
                {(!decision.actions || decision.actions.length === 0) ? (
                  <div className="text-gray-500 text-sm italic pl-5">{t[language].noActions}</div>
                ) : (
                  decision.actions.map((action, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-lg p-5 border transition-all hover:border-opacity-60 ${action.status === 'rejected'
                        ? 'bg-red-900/10 border-red-500/50'
                        : 'bg-[#0a0e1a] border-[#1e2942]'
                        }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-white font-['DIN_Alternate',sans-serif]">
                            {action.symbol}
                          </span>
                          {action.status === 'rejected' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              {t[language].rejected}
                            </span>
                          ) : (
                            <>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase border ${action.action.toUpperCase().includes('LONG')
                                ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                                : action.action.toUpperCase().includes('SHORT')
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-[#151b2e] text-gray-300 border-[#1e2942]'
                                }`}>
                                {action.action.toUpperCase()}
                              </span>
                              {action.leverage && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-['DIN_Alternate',sans-serif]">
                                  {action.leverage}x
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">{t[language].positionLabel}:</span>
                          <span className="text-white text-sm font-['DIN_Alternate',sans-serif]">
                            {action.position_size_usd ? `$${action.position_size_usd.toLocaleString()}` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="mb-4">
                        <div className="text-gray-500 text-xs mb-2">{t[language].reasoning}</div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {getText(action.entry_reason, language) || '-'}
                        </p>
                      </div>

                      {/* TP & SL */}
                      <div className="grid grid-cols-2 gap-3 border-t border-gray-800/50 pt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">{t[language].takeProfit}: </span>
                          <span className="text-teal-400 font-bold font-['DIN_Alternate',sans-serif] text-base">
                            {action.exit_plan?.take_profit ? `$${action.exit_plan.take_profit.toLocaleString()}` : '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">{t[language].stopLoss}: </span>
                          <span className="text-rose-400 font-bold font-['DIN_Alternate',sans-serif] text-base">
                            {action.exit_plan?.stop_loss ? `$${action.exit_plan.stop_loss.toLocaleString()}` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {action.status === 'rejected' && action.rejection_reason && (
                        <div className="mt-3 pt-3 border-t border-red-500/30">
                          <div className="text-red-400 text-xs mb-1 font-bold">{t[language].rejectionReason}:</div>
                          <p className="text-red-300/80 text-sm leading-tight">
                            {action.rejection_reason}
                          </p>
                        </div>
                      )}


                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Divider for multiple decisions if we were showing them, basically just spacing */}
            {index < decisions.length - 1 && <div className="h-8"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}