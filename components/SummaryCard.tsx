


import React from 'react';
import { RealizedPLPeriod } from '../types';
import PlusIcon from './icons/PlusIcon';
import RefreshIcon from './icons/RefreshIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

interface SummaryCardProps {
  unrealizedPL: number;
  realizedPL: number;
  realizedPLPeriod: RealizedPLPeriod;
  onRealizedPLPeriodChange: (period: RealizedPLPeriod) => void;
  customDateRange: { start: string; end: string };
  onCustomDateRangeChange: (range: { start: string; end: string }) => void;
  onRefresh: () => void;
  isLoading: boolean;
  hasPositions: boolean;
  onAdd: () => void;
  isFormVisible: boolean;
  hasAccounts: boolean;
  apiKeysConfigured: boolean;
}

const formatCurrency = (value: number | null | undefined, sign: boolean = false) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  const options = { style: 'currency', currency: 'USD' };
  const formatted = new Intl.NumberFormat('en-US', options).format(value);
  if (sign && value > 0) return `+${formatted}`;
  return formatted;
};

const periodOptions: { value: RealizedPLPeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'last365', label: 'Last 365 Days' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range...' },
];

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  unrealizedPL, 
  realizedPL, 
  realizedPLPeriod,
  onRealizedPLPeriodChange,
  customDateRange,
  onCustomDateRangeChange,
  onRefresh, 
  isLoading, 
  hasPositions, 
  onAdd, 
  isFormVisible, 
  hasAccounts,
  apiKeysConfigured
}) => {
  const unrealizedPLColor = unrealizedPL > 0 ? 'text-green-400' : unrealizedPL < 0 ? 'text-red-400' : 'text-gray-200';
  const realizedPLColor = realizedPL > 0 ? 'text-green-400' : realizedPL < 0 ? 'text-red-400' : 'text-gray-200';

  const bgGradient = unrealizedPL > 0 
    ? 'from-green-500/10 to-gray-800/0' 
    : unrealizedPL < 0 
    ? 'from-red-500/10 to-gray-800/0' 
    : 'from-gray-700/10 to-gray-800/0';

  const addOrCloseButtonColor = isFormVisible ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700';

  const getRefreshButtonTitle = () => {
    if (!apiKeysConfigured) return "Please configure API keys in settings";
    if (!hasPositions) return "Add a position to enable refresh";
    return "Refresh live market prices";
  }

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50 bg-gradient-to-r ${bgGradient}`}>
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-6 md:gap-10 text-center md:text-left">
          {/* Unrealized P/L */}
          <div>
            <h2 className="text-lg font-semibold text-gray-400 mb-1">Unrealized P/L</h2>
            <p className={`text-4xl font-bold ${unrealizedPLColor}`}>
              {formatCurrency(unrealizedPL, true)}
            </p>
          </div>
          {/* Realized P/L */}
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h2 className="text-lg font-semibold text-gray-400">Realized P/L</h2>
                <select 
                    value={realizedPLPeriod} 
                    onChange={(e) => onRealizedPLPeriodChange(e.target.value as RealizedPLPeriod)}
                    className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none"
                    aria-label="Select period for realized P/L"
                >
                    {periodOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
            <p className={`text-4xl font-bold ${realizedPLColor}`}>
              {formatCurrency(realizedPL, true)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <button
            onClick={onAdd}
            disabled={!hasAccounts}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white ${addOrCloseButtonColor} transition-colors shadow-md disabled:bg-gray-600 disabled:cursor-not-allowed`}
            title={!hasAccounts ? "Please add an account first" : ""}
          >
            {isFormVisible ? <ChevronUpIcon /> : <PlusIcon />}
            {isFormVisible ? 'Close Form' : 'Add New Strategy'}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading || !hasPositions || !apiKeysConfigured}
            className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed shadow-md"
            title={getRefreshButtonTitle()}
          >
            <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Refreshing...' : 'Refresh Prices'}
          </button>
        </div>
      </div>
      
      {realizedPLPeriod === 'custom' && (
        <div className="mt-6 pt-4 border-t border-gray-700/50 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-400">From:</label>
            <input 
              type="date" 
              id="start-date"
              value={customDateRange.start}
              onChange={e => onCustomDateRangeChange({ ...customDateRange, start: e.target.value })}
              max={customDateRange.end}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-sm font-medium text-gray-400">To:</label>
            <input 
              type="date" 
              id="end-date"
              value={customDateRange.end}
              onChange={e => onCustomDateRangeChange({ ...customDateRange, end: e.target.value })}
              min={customDateRange.start}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;