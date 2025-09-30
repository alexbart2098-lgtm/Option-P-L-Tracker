import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PLHistoryData } from '../types';
import ChartBarIcon from './icons/ChartBarIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface PLChartProps {
  data: PLHistoryData[];
}

type Timeframe = '30d' | '90d' | 'ytd' | 'all';

const timeframes: { id: Timeframe; label: string }[] = [
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'ytd', label: 'YTD' },
  { id: 'all', label: 'All' },
];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 shadow-lg">
        <p className="label text-gray-300 font-semibold">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${formatCurrency(pld.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PLChart: React.FC<PLChartProps> = ({ data }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDateStr: string;

    switch (timeframe) {
      case '30d':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
        break;
      case '90d':
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        startDateStr = ninetyDaysAgo.toISOString().split('T')[0];
        break;
      case 'ytd':
        startDateStr = `${now.getFullYear()}-01-01`;
        break;
      case 'all':
      default:
        // Use a very old date to include everything
        startDateStr = '1970-01-01'; 
    }

    return data
      .filter(d => d.date >= startDateStr)
      .map(item => ({
        ...item,
        // Parse the date string as UTC to format it correctly for the chart axis, preventing timezone shifts.
        date: new Date(item.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
  }, [data, timeframe]);

  if (data.length === 0) {
    return null; // Don't render the component if there's no historical data
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700/50"
        onClick={() => setIsVisible(!isVisible)}
        aria-expanded={isVisible}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <ChartBarIcon className="text-green-400" />
          <h2 className="text-xl font-bold text-gray-100">P/L History</h2>
        </div>
        <div className="flex items-center gap-4">
            {isVisible && timeframes.map(tf => (
                 <button 
                    key={tf.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        setTimeframe(tf.id);
                    }}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                        timeframe === tf.id 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {tf.label}
                 </button>
            ))}
          {isVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
      </div>
      {isVisible && (
        <div className="p-4 pt-2">
            {filteredData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                    data={filteredData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                    >
                    <defs>
                        <linearGradient id="colorUnrealized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" />
                    <XAxis dataKey="date" stroke="#A9A9A9" />
                    <YAxis stroke="#A9A9A9" tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="unrealizedPL" name="Unrealized P/L" stroke="#38bdf8" fillOpacity={1} fill="url(#colorUnrealized)" />
                    <Area type="monotone" dataKey="realizedPL" name="Realized P/L" stroke="#4ade80" fillOpacity={1} fill="url(#colorRealized)" />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Not enough data to display the chart for this timeframe.
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PLChart;