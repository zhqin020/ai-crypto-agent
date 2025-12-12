import { useRef, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface NavRecord {
  date: string;
  value: number;
  profit: number;
}

const AnimatedDot = (props: any) => {
  const { cx, cy, isProfit } = props;
  const color = isProfit ? '#2dd4bf' : '#fb7185';

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

export function ProfitChart({ language = 'zh' }: { language?: 'zh' | 'en' }) {
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
        const response = await fetch('http://localhost:5001/api/nav-history');
        if (response.ok) {
          const json = await response.json();
          // Assuming API returns similar structure or array of { timestamp, nav }
          // If simpler, adapt here.
          records = json.map((item: any) => {
            if (!item.timestamp) return null;
            const dateObj = new Date(item.timestamp.replace(' ', 'T') + 'Z');
            const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
            return {
              date: dateStr,
              value: Math.round(item.nav),
              profit: Math.round(item.nav - 10000)
            };
          }).filter((item: any) => item !== null);
        }
      }

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

  useEffect(() => {
    if (scrollContainerRef.current && data.length > 0) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [data]);

  const currentValue = data.length > 0 ? data[data.length - 1].value : 10000;
  const totalProfit = currentValue - 10000;
  const profitPercentage = ((totalProfit / 10000) * 100).toFixed(2);
  const isProfit = currentValue >= 10000;
  const chartColor = isProfit ? '#2dd4bf' : '#fb7185';

  const minValue = Math.min(...data.map(d => d.value), 9000);
  const maxValue = Math.max(...data.map(d => d.value), 11000);
  const padding = (maxValue - minValue) * 0.1;
  const yMin = Math.floor(minValue - padding);
  const yMax = Math.ceil(maxValue + padding);
  const yRange = yMax - yMin;
  const baseline10kPosition = ((yMax - 10000) / yRange) * 100;

  const now = new Date();
  const currentDateTime = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  const t = {
    zh: {
      initialCapital: '初始资金',
      currentValue: '当前净值',
      totalProfit: '总收益',
      netWorth: '净值',
    },
    en: {
      initialCapital: 'Initial Capital',
      currentValue: 'Current Value',
      totalProfit: 'Total Profit',
      netWorth: 'Net Worth',
    },
  };

  if (loading && data.length === 0) return <div className="text-gray-400 p-4">Loading chart...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-3 gap-4 mb-4 flex-shrink-0">
        <div className="bg-[#0a0e1a] rounded-lg p-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].initialCapital}</div>
          <div className="text-white font-['DIN_Alternate',sans-serif] text-xl">$10,000</div>
        </div>
        <div className="bg-[#0a0e1a] rounded-lg p-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].currentValue}</div>
          <div className="text-white font-['DIN_Alternate',sans-serif] text-xl">${currentValue.toLocaleString()}</div>
        </div>
        <div className={`bg-[#0a0e1a] rounded-lg p-4 relative`}>
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{t[language].totalProfit}</div>
          <div className={`flex items-center gap-2 font-['DIN_Alternate',sans-serif] text-xl ${totalProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-4" />}
            {totalProfit >= 0 ? '+' : ''}{profitPercentage}%
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative" style={{ minHeight: '300px' }}>
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ height: 'calc(100% - 24px)' }}>
          <div className="relative h-full" style={{ paddingTop: '10px' }}>
            <div className="absolute inset-0 bg-[#151b2e] opacity-90"></div>
            <div className="absolute top-0 right-0 bottom-0 w-px bg-[#1e2942]"></div>
            <div className="relative h-full flex flex-col">
              <div className="text-gray-500 font-['DIN_Alternate',sans-serif] text-xs text-right pr-3">
                ${(Math.round(yMax) / 1000).toFixed(1)}k
              </div>
              <div className="flex-1 relative">
                <div
                  className="absolute text-gray-500 font-['DIN_Alternate',sans-serif] text-xs text-right pr-3 leading-none"
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

        <div className="absolute left-20 right-0 top-0 z-[5] pointer-events-none" style={{ height: 'calc(100% - 24px)', paddingTop: '10px' }}>
          <div className="relative h-full">
            <div
              className="absolute left-0 right-0 border-t border-dashed"
              style={{
                top: `${baseline10kPosition}%`,
                borderColor: 'rgba(96, 165, 250, 0.3)',
                borderWidth: '1px'
              }}
            ></div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto min-h-0 h-full"
        >
          <div style={{ width: `${Math.max(1200, data.length * 60)}px`, height: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e2942"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontFamily: 'DIN Alternate, sans-serif', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2942', strokeWidth: 1 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value, index) => {
                    if (value === data[data.length - 1].date) return currentDateTime;
                    return value;
                  }}
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
                    backgroundColor: '#0a0e1a',
                    border: `1px solid ${chartColor}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'DIN Alternate, sans-serif'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, t[language].netWorth]}
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