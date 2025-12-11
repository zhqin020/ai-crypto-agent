import { useState, useEffect } from 'react';
import { Brain, Activity } from 'lucide-react';

interface AgentAction {
  symbol: string;
  action: string;
  leverage: number | null;
  position_size_usd: number | null;
  entry_reason: string | null;
  exit_plan: {
    take_profit?: number | null;
    stop_loss?: number | null;
    invalidation?: string | null;
  };
}

interface AgentDecision {
  analysis_summary: string;
  actions: AgentAction[];
  timestamp?: string;
}

export function ModelDecisionTab() {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        let data: AgentDecision | AgentDecision[];

        if (import.meta.env.MODE === 'production') {
          const response = await fetch('/data/agent_decision_log.json');
          if (!response.ok) throw new Error('Failed to fetch agent log');
          data = await response.json();
        } else {
          const response = await fetch('http://localhost:5001/api/agent-decision');
          if (!response.ok) throw new Error('Failed to fetch agent log');
          data = await response.json();
        }

        // Normalize to array
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
  }, []);

  if (loading) return <div className="text-gray-400 p-4">加载模型思考中...</div>;
  if (error) return <div className="text-red-400 p-4">{error}</div>;
  if (decisions.length === 0) return <div className="text-gray-500 p-4">暂无决策记录</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="space-y-8 overflow-y-auto pr-2 flex-1">
        {decisions.map((decision, index) => (
          <div key={index}>
            {/* Timestamp Header */}
            <div
              className={`mb-4 ${index === 0
                ? 'bg-gradient-to-r from-neon-cyan/20 to-transparent border-l-4 border-neon-cyan'
                : 'bg-gradient-to-r from-gray-600/20 to-transparent border-l-4 border-gray-600'
                } rounded-lg p-3.5 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                {index === 0 && <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>}
                <span className="text-gray-300 font-['DIN_Alternate',sans-serif] text-sm">
                  {(() => {
                    if (!decision.timestamp) return 'Unknown Time';
                    try {
                      // Backend sends UTC time like "2025-11-27 20:13:52"
                      // Replace space with T and append Z to ensure UTC parsing
                      const utcTime = decision.timestamp.replace(' ', 'T') + 'Z';
                      const date = new Date(utcTime);
                      return date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short',
                        hour12: false
                      });
                    } catch (e) {
                      return decision.timestamp + ' (UTC)';
                    }
                  })()}
                </span>
              </div>
              {index === 0 && (
                <div className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-xs rounded border border-neon-cyan/30">
                  LATEST
                </div>
              )}
            </div>

            {/* Market Analysis */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-neon-cyan" />
                <h3 className="text-neon-cyan">市场分析</h3>
              </div>
              <div className="bg-dark-card border border-dark-card/80 rounded-lg p-5">
                <p className="text-gray-300 leading-relaxed text-sm">
                  {decision.analysis_summary}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-neon-cyan" />
                <h3 className="text-neon-cyan">执行动作 ({decision.actions?.length || 0})</h3>
              </div>

              <div className="space-y-4">
                {(!decision.actions || decision.actions.length === 0) ? (
                  <div className="text-gray-500 text-sm italic pl-1">本次无交易操作 (观望)</div>
                ) : (
                  decision.actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="bg-dark-card border border-dark-card/80 rounded-lg p-5 hover:border-neon-cyan/50 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="text-neon-cyan font-bold text-lg">{action.symbol}</div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${action.action?.includes('long') ? 'bg-neon-green/10 text-neon-green' :
                            action.action?.includes('short') ? 'bg-neon-rose/10 text-neon-rose' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                            {action.action?.replace('_', ' ') || 'UNKNOWN'}
                          </span>
                          {action.leverage && (
                            <span className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-xs rounded font-['DIN_Alternate',sans-serif]">
                              {action.leverage}x
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">仓位大小:</span>
                          <span className="text-white text-sm font-['DIN_Alternate',sans-serif]">
                            {action.position_size_usd ? `$${action.position_size_usd.toLocaleString()}` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="mb-4">
                        <div className="text-gray-500 text-sm mb-2">决策逻辑</div>
                        <p className="text-gray-300 leading-relaxed text-sm">
                          {action.entry_reason || '无详细理由'}
                        </p>
                      </div>

                      {/* TP & SL - 左右布局 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-gray-500 text-sm">止盈价: </span>
                          <span className="text-neon-green font-['DIN_Alternate',sans-serif]">
                            {action.exit_plan?.take_profit ? `$${action.exit_plan.take_profit.toLocaleString()}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">止损价: </span>
                          <span className="text-neon-rose font-['DIN_Alternate',sans-serif]">
                            {action.exit_plan?.stop_loss ? `$${action.exit_plan.stop_loss.toLocaleString()}` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}