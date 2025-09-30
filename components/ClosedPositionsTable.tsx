

import React, { useState } from 'react';
import { OptionStrategy, OptionLeg, OptionType, OptionAction, SortConfig, SortableKey } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import SortIcon from './icons/SortIcon';

interface ClosedPositionsTableProps {
  positions: OptionStrategy[];
  sortConfig: SortConfig;
  onSort: (key: SortableKey) => void;
}

const formatCurrency = (value: number | null | undefined, sign: boolean = false) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  const options = { style: 'currency', currency: 'USD' };
  const formatted = new Intl.NumberFormat('en-US', options).format(value);
  if (sign && value > 0) return `+${formatted}`;
  return formatted;
};

const LegRow: React.FC<{ leg: OptionLeg }> = ({ leg }) => {
    const isCall = leg.type === OptionType.CALL;
    const isBuy = leg.action === OptionAction.BUY;

    return (
        <tr className="bg-gray-700/50">
            <td className="p-2 pl-8 font-mono text-sm">{leg.ticker}</td>
            <td className={`p-2 font-semibold text-sm ${isBuy ? 'text-green-400' : 'text-orange-400'}`}>{leg.action}</td>
            <td className={`p-2 font-semibold text-sm ${isCall ? 'text-green-400' : 'text-red-400'}`}>{leg.type}</td>
            <td className="p-2 text-sm">{formatCurrency(leg.strike)}</td>
            <td className="p-2 text-sm">{leg.expiration}</td>
            <td className="p-2 text-sm text-right">{leg.contracts}</td>
            <td className="p-2 text-sm text-right">{formatCurrency(leg.purchasePrice)}</td>
        </tr>
    );
};

const ClosedPositionsTable: React.FC<ClosedPositionsTableProps> = ({ positions, sortConfig, onSort }) => {
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set());

  const toggleExpand = (strategyId: string) => {
    setExpandedStrategies(prev => {
        const newSet = new Set(prev);
        if (newSet.has(strategyId)) {
            newSet.delete(strategyId);
        } else {
            newSet.add(strategyId);
        }
        return newSet;
    });
  };

  const renderSortArrow = (columnKey: SortableKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
        return <SortIcon direction="none" />;
    }
    return <SortIcon direction={sortConfig.direction} />;
  };

  if (positions.length === 0) {
    return (
        <div className="text-center py-16 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <h3 className="text-xl font-semibold text-gray-200">No Closed Positions</h3>
            <p className="text-gray-400 mt-2">Your closed trades will appear here once you close an open position.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-900/70">
                <tr>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('name')}>
                        <div className="flex items-center gap-2">Strategy / Ticker {renderSortArrow('name')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('openDate')}>
                        <div className="flex items-center gap-2">Open Date {renderSortArrow('openDate')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('closeDate')}>
                        <div className="flex items-center gap-2">Close Date {renderSortArrow('closeDate')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right cursor-pointer" onClick={() => onSort('realizedPL')}>
                        <div className="flex items-center justify-end gap-2">Realized P/L {renderSortArrow('realizedPL')}</div>
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                {positions.map((strategy) => {
                    const isSingleLeg = strategy.legs.length === 1;
                    const pl = strategy.realizedPL ?? 0;
                    const plColor = pl > 0 ? 'text-green-400' : pl < 0 ? 'text-red-400' : 'text-gray-300';
                    
                    if (isSingleLeg) {
                        return (
                             <tr key={strategy.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-bold">{strategy.name}</td>
                                <td className="p-4">{strategy.openDate || 'N/A'}</td>
                                <td className="p-4">{strategy.closeDate || 'N/A'}</td>
                                <td className={`p-4 text-right font-semibold ${plColor}`}>
                                    {formatCurrency(pl, true)}
                                </td>
                            </tr>
                        );
                    }
                    
                    const isExpanded = expandedStrategies.has(strategy.id);
                    
                    return (
                        <React.Fragment key={strategy.id}>
                            <tr onClick={() => toggleExpand(strategy.id)} className="hover:bg-gray-700/50 transition-colors cursor-pointer">
                                <td className="p-4 font-bold flex items-center gap-2">
                                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    {strategy.name}
                                </td>
                                <td className="p-4">{strategy.openDate || 'N/A'}</td>
                                <td className="p-4">{strategy.closeDate || 'N/A'}</td>
                                <td className={`p-4 text-right font-bold ${plColor}`}>
                                    {formatCurrency(pl, true)}
                                </td>
                            </tr>
                            {isExpanded && (
                                <tr className="bg-gray-800">
                                    <td colSpan={4} className="p-0">
                                        <div className="p-4">
                                            <h4 className="px-4 pb-2 text-md font-semibold text-gray-300">Strategy Legs</h4>
                                            <table className="w-full text-left bg-gray-900/50 rounded-md">
                                                <thead className="bg-gray-700/50">
                                                    <tr>
                                                        <th className="p-2 pl-8 font-semibold text-gray-400 text-sm">Ticker</th>
                                                        <th className="p-2 font-semibold text-gray-400 text-sm">Action</th>
                                                        <th className="p-2 font-semibold text-gray-400 text-sm">Type</th>
                                                        <th className="p-2 font-semibold text-gray-400 text-sm">Strike</th>
                                                        <th className="p-2 font-semibold text-gray-400 text-sm">Expiry</th>
                                                        <th className="p-2 font-semibold text-gray-400 text-sm text-right">Qty</th>
                                                        <th className="p-2 font-semibold text-gray-400 text-sm text-right">Open Premium</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {strategy.legs.map(leg => <LegRow key={leg.id} leg={leg} />)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default ClosedPositionsTable;