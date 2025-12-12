import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, Dot } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useEffect, useRef } from 'react';

// 生成模拟收益数据 - 更曲折的曲线，更多数据点
const generateProfitData = () => {
  const data = [];
  let value = 10000;
  const days = 90; // 增加到90天，让图表可以滚动
  
  for (let i = 0; i < days; i++) {
    // 增加波动幅度，让曲线更曲折
    const volatility = 400;
    const trend = 0.45; // 调整趋势，让盈利和亏损都有可能
    const change = (Math.random() - trend) * volatility;
    value += change;
    
    // 确保不会低于初始资金的50%（风控底线）
    value = Math.max(value, 5000);
    
    data.push({
      date: (i + 1) + '日',
      value: Math.round(value),
      profit: Math.round(value - 10000),
    });
  }
  
  return data;
};

const data = generateProfitData();
const currentValue = data[data.length - 1].value;
const totalProfit = currentValue - 10000;
const profitPercentage = ((totalProfit / 10000) * 100).toFixed(2);

// 闪烁的圆点组件
const AnimatedDot = (props: any) => {
  const { cx, cy, isProfit } = props;
  const color = isProfit ? '#2dd4bf' : '#fb7185'; // teal-400: #2dd4bf, rose-400: #fb7185
  
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

export function ProfitChart({ language }: { language: 'zh' | 'en' }) {
  // 计算Y轴的范围
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const padding = (maxValue - minValue) * 0.1; // 10%的上下边距
  
  // 计算Y轴domain和10k位置的百分比
  const yMin = Math.max(minValue - padding, 4000); // Y轴下限，至少留出一些空间
  const yMax = maxValue + padding;
  const yRange = yMax - yMin;
  const baseline10kPosition = ((yMax - 10000) / yRange) * 100; // 10k在Y轴上的百分比位置
  
  // 获取当前日期时间
  const now = new Date();
  const currentDateTime = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 判断是否盈利
  const isProfit = currentValue >= 10000;
  const chartColor = isProfit ? '#2dd4bf' : '#fb7185'; // teal-400: #2dd4bf, rose-400: #fb7185
  
  // 滚动到最右边
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);
  
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
  
  return (
    <div className="h-full flex flex-col">
      {/* Stats */}
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
            {totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {totalProfit >= 0 ? '+' : ''}{profitPercentage}%
          </div>
        </div>
      </div>

      {/* Chart - Y轴固定，图表可滚动 */}
      <div className="flex-1 flex relative min-h-0">
        {/* 固定的Y轴标签层 - 悬浮在图表上方 */}
        <div className="absolute left-0 top-0 bottom-6 w-20 z-10 pointer-events-none">
          <div className="relative h-full pt-2">
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-[#151b2e]"></div>
            {/* Y轴分隔线 */}
            <div className="absolute top-0 right-0 bottom-0 w-px bg-[#1e2942]"></div>
            {/* 标签 */}
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
        
        {/* 固定的基准线层 - 悬浮在图表上方，延伸到右侧 */}
        <div className="absolute left-20 right-0 top-0 bottom-6 z-[5] pointer-events-none">
          <div className="relative h-full pt-2">
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
        
        {/* 可滚动的图表区域 */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto h-full" 
        >
          <div style={{ width: '1880px', height: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
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
                    return '';
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