import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, Dot } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NavRecord {
  date: string;
  value: number;
  profit: number;
}

// 闪烁的圆点组件
const AnimatedDot = (props: any) => {
  const { cx, cy, isProfit } = props;
  const color = isProfit ? '#a3e635' : '#ef4444';

  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.3}>
        <animate
          attributeName="r"
          from="6"
          to="12"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="0.6"
          to="0"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={cx} cy={cy} r={4} fill={color} />
    </g>
  );
};

export function ProfitChart() {
  const [data, setData] = useState<NavRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchNavHistory = async () => {
    try {
      setLoading(true);
      let records: NavRecord[] = [];

      if (import.meta.env.MODE === 'production') {
        const response = await fetch('/data/nav_history.csv');
        if (response.ok) {
          const text = await response.text();
          const lines = text.trim().split('\n');
          // Skip header
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const [timestamp, navStr] = line.split(',');
            const nav = parseFloat(navStr);
            const dateObj = new Date(timestamp.replace(' ', 'T') + 'Z');
            const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

            records.push({
              date: dateStr,
              value: Math.round(nav),
              profit: Math.round(nav - 10000)
            });
          }
        }
      } else {
        // Dev mode fallback or API
        const response = await fetch('http://localhost:5001/api/nav-history'); // Assuming API exists or fallback to static
        if (response.ok) {
          const json = await response.json();
          records = json.map((item: any) => {
            const dateObj = new Date(item.timestamp.replace(' ', 'T') + 'Z');
            const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
            return {
              date: dateStr,
              value: Math.round(item.nav),
              profit: Math.round(item.nav - 10000)
            };
          });
        }
      }

      // If no data, provide at least one point
      if (records.length === 0) {
        records.push({ date: 'Start', value: 10000, profit: 0 });
      }

      setData(records);
    } catch (e) {
      console.error("Failed to load NAV history", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavHistory();
    const interval = setInterval(fetchNavHistory, 60000);
    return () => clearInterval(interval);
  }, []);

  // 滚动到最右边
  useEffect(() => {
    if (scrollContainerRef.current && data.length > 0) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [data]);

  if (loading && data.length === 0) return <div className="text-gray-400 p-4">加载图表中...</div>;

  const currentValue = data.length > 0 ? data[data.length - 1].value : 10000;
  const totalProfit = currentValue - 10000;
  const profitPercentage = ((totalProfit / 10000) * 100).toFixed(2);
  const isProfit = currentValue >= 10000;
  const chartColor = isProfit ? '#a3e635' : '#ef4444';

  // 计算Y轴的范围
  const minValue = Math.min(...data.map(d => d.value), 9000); // Ensure some buffer
  const maxValue = Math.max(...data.map(d => d.value), 11000);
  const padding = (maxValue - minValue) * 0.1;
  const yMin = Math.floor(minValue - padding);
  const yMax = Math.ceil(maxValue + padding);
  const yRange = yMax - yMin;
  const baseline10kPosition = ((yMax - 10000) / yRange) * 100;

  // 获取当前日期时间
  const now = new Date();
  const currentDateTime = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 flex-shrink-0">
        <div className="bg-[#1f2229] rounded-lg p-4 border border-gray-700/50">
          <div className="text-gray-400 text-sm mb-1">初始资金</div>
          <div className="text-white font-['DIN_Alternate',sans-serif]">$10,000</div>
        </div>
        <div className="bg-[#1f2229] rounded-lg p-4 border border-gray-700/50">
          <div className="text-gray-400 text-sm mb-1">当前净值</div>
          <div className="text-white font-['DIN_Alternate',sans-serif]">${currentValue.toLocaleString()}</div>
        </div>
        <div className={`bg-[#1f2229] rounded-lg p-4 border ${totalProfit >= 0 ? 'border-lime-500/30' : 'border-red-500/30'}`}>
          <div className="text-gray-400 text-sm mb-1">总收益</div>
          <div className={`flex items-center gap-1 font-['DIN_Alternate',sans-serif] ${totalProfit >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {totalProfit >= 0 ? '+' : ''}{profitPercentage}%
          </div>
        </div>
      </div>

      {/* Chart - Y轴固定，图表可滚动 */}
      <div className="flex-1 flex min-h-0 relative">
        {/* 固定的Y轴标签层 - 悬浮在图表上方 */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ height: 'calc(100% - 24px)' }}>
          <div className="relative h-full" style={{ paddingTop: '10px' }}>
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-[#2a2d35]"></div>
            {/* Y轴分隔线 */}
            <div className="absolute top-0 right-0 bottom-0 w-px bg-gray-600"></div>
            {/* 标签 */}
            <div className="relative h-full flex flex-col">
              <div className="text-gray-400 font-['DIN_Alternate',sans-serif] text-sm text-right pr-3">
                ${(Math.round(yMax) / 1000).toFixed(1)}k
              </div>
              <div className="flex-1 relative">
                <div
                  className="absolute text-gray-400 font-['DIN_Alternate',sans-serif] text-sm text-right pr-3 leading-none"
                  style={{
                    top: `${baseline10kPosition}%`,
                    right: 0,
                    transform: 'translateY(-50%)'
                  }}
                >
                  $10k
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 固定的基准线层 - 悬浮在图表上方，延伸到右侧 */}
        <div className="absolute left-20 right-0 top-0 z-[5] pointer-events-none" style={{ height: 'calc(100% - 24px)', paddingTop: '10px' }}>
          <div className="relative h-full">
            <div
              className="absolute left-0 right-0 border-t border-dashed"
              style={{
                top: `${baseline10kPosition}%`,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                borderWidth: '1px'
              }}
            ></div>
          </div>
        </div>

        {/* 可滚动的图表区域 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto min-h-0 h-full"
        >
          <div style={{ width: `${Math.max(data.length * 50, 800)}px`, height: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3e635" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontFamily: 'DIN Alternate, sans-serif', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="transparent"
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                  domain={[yMin, yMax]}
                  width={0}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2229',
                    border: `1px solid ${chartColor}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'DIN Alternate, sans-serif'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '净值']}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={isProfit ? 'url(#colorProfit)' : 'url(#colorLoss)'}
                  dot={(props) => {
                    const { index } = props;
                    // 只在最后一个点显示闪烁动画
                    if (index === data.length - 1) {
                      return <AnimatedDot {...props} isProfit={isProfit} />;
                    }
                    return null;
                  }}
                  activeDot={{ r: 6, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}