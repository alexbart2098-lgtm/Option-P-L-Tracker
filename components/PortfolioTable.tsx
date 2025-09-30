import React, { useState } from 'react';
import { OptionStrategy, OptionLeg, OptionType, OptionAction, SortConfig, SortableKey } from '../types';
import { calculateMargin } from '../services/marginCalculator';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import EditIcon from './icons/EditIcon';
import RollIcon from './icons/RollIcon';
import XIcon from './icons/XIcon';
import SortIcon from './icons/SortIcon';

interface PortfolioTableProps {
  positions: OptionStrategy[];
  stockData: Record<string, { price: number; previousClose: number }>;
  isLoading: boolean;
  onEdit: (strategy: OptionStrategy) => void;
  onRoll: (strategy: OptionStrategy) => void;
  onClose: (strategy: OptionStrategy) => void;
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

const Shimmer: React.FC = () => (
    <div className="animate-pulse bg-gray-600 h-5 w-20 rounded-md"></div>
)

const LegRow: React.FC<{leg: OptionLeg, isLoading: boolean, underlyingPrice?: number}> = ({ leg, isLoading, underlyingPrice }) => {
    const isCall = leg.type === OptionType.CALL;
    const isBuy = leg.action === OptionAction.BUY;
    const plColor = leg.pl > 0 ? 'text-green-400' : leg.pl < 0 ? 'text-red-400' : 'text-gray-300';

    return (
        <tr className="bg-gray-800">
            <td className="p-4 pl-12 font-mono">{leg.ticker}</td>
            <td className="p-4 font-mono">
                 {isLoading && underlyingPrice === undefined ? <div className="flex justify-start"><Shimmer /></div> : formatCurrency(underlyingPrice)}
            </td>
            <td></td> {/* Empty cell for Open Date column */}
            <td className={`p-4 font-semibold ${isBuy ? 'text-green-400' : 'text-orange-400'}`}>{leg.action}</td>
            <td className={`p-4 font-semibold ${isCall ? 'text-green-400' : 'text-red-400'}`}>{leg.type}</td>
            <td className="p-4">{formatCurrency(leg.strike)}</td>
            <td className="p-4">{leg.expiration}</td>
            <td className="p-4 text-right">{leg.contracts}</td>
            <td className="p-4 text-right">{formatCurrency(leg.purchasePrice)}</td>
            <td className="p-4 text-right font-mono">{'—'}</td>
            <td className={`p-4 text-right font-semibold ${plColor}`}>
                {isLoading ? (
                    <div className="flex justify-end"><Shimmer /></div>
                ) : (
                    formatCurrency(leg.pl, true)
                )}
            </td>
            <td className="p-4"></td> {/* Empty cell for actions column */}
        </tr>
    )
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ positions, stockData, isLoading, onEdit, onRoll, onClose, sortConfig, onSort }) => {
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
            <h3 className="text-xl font-semibold text-gray-200">Your Portfolio is Empty</h3>
            <p className="text-gray-400 mt-2">Add a new strategy to start tracking your options.</p>
        </div>
    )
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
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Underlying Price</th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('openDate')}>
                        <div className="flex items-center gap-2">Open Date {renderSortArrow('openDate')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('action')}>
                        <div className="flex items-center gap-2">Action {renderSortArrow('action')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('type')}>
                        <div className="flex items-center gap-2">Type {renderSortArrow('type')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('strike')}>
                        <div className="flex items-center gap-2">Strike {renderSortArrow('strike')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider cursor-pointer" onClick={() => onSort('expiration')}>
                        <div className="flex items-center gap-2">Expiry {renderSortArrow('expiration')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right cursor-pointer" onClick={() => onSort('contracts')}>
                        <div className="flex items-center justify-end gap-2">Qty {renderSortArrow('contracts')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right cursor-pointer" onClick={() => onSort('purchasePrice')}>
                        <div className="flex items-center justify-end gap-2">Premium {renderSortArrow('purchasePrice')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right cursor-pointer" onClick={() => onSort('margin')}>
                        <div className="flex items-center justify-end gap-2">Margin {renderSortArrow('margin')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right cursor-pointer" onClick={() => onSort('totalPL')}>
                        <div className="flex items-center justify-end gap-2">P/L {renderSortArrow('totalPL')}</div>
                    </th>
                    <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-center">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                {positions.map((strategy) => {
                    const isSingleLeg = strategy.legs.length === 1;
                    const strategyMargin = calculateMargin(strategy);
                    const formattedMargin = isFinite(strategyMargin) 
                        ? formatCurrency(strategyMargin) 
                        : <span title="Margin for naked calls cannot be calculated without the underlying stock price.">N/A</span>;

                    const actionButtons = (
                        <div className="flex items-center justify-center gap-2">
                            {isSingleLeg && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRoll(strategy); }}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                    aria-label={`Roll ${strategy.name}`}
                                    title="Roll Position"
                                >
                                    <RollIcon />
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(strategy); }}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                                aria-label={`Edit ${strategy.name}`}
                                title="Edit Strategy"
                            >
                                <EditIcon />
                            </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); onClose(strategy); }}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                aria-label={`Close ${strategy.name}`}
                                title="Close Position"
                            >
                                <XIcon />
                            </button>
                        </div>
                    );
                    
                    if (isSingleLeg) {
                        const leg = strategy.legs[0];
                        const plColor = strategy.totalPL > 0 ? 'text-green-400' : strategy.totalPL < 0 ? 'text-red-400' : 'text-gray-300';
                        const isCall = leg.type === OptionType.CALL;
                        const isBuy = leg.action === OptionAction.BUY;
                        const underlyingPrice = stockData[leg.ticker]?.price;

                        return (
                             <tr key={strategy.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-bold">{strategy.name}</td>
                                <td className="p-4 font-mono">
                                    {isLoading && underlyingPrice === undefined ? <div className="flex justify-start"><Shimmer/></div> : formatCurrency(underlyingPrice)}
                                </td>
                                <td className="p-4">{strategy.openDate}</td>
                                <td className={`p-4 font-semibold ${isBuy ? 'text-green-400' : 'text-orange-400'}`}>{leg.action}</td>
                                <td className={`p-4 font-semibold ${isCall ? 'text-green-400' : 'text-red-400'}`}>{leg.type}</td>
                                <td className="p-4">{formatCurrency(leg.strike)}</td>
                                <td className="p-4">{leg.expiration}</td>
                                <td className="p-4 text-right">{leg.contracts}</td>
                                <td className="p-4 text-right">{formatCurrency(leg.purchasePrice)}</td>
                                <td className="p-4 text-right font-mono">
                                    {formattedMargin}
                                </td>
                                <td className={`p-4 text-right font-semibold ${plColor}`}>
                                    {isLoading ? (
                                        <div className="flex justify-end"><Shimmer /></div>
                                    ) : (
                                        formatCurrency(strategy.totalPL, true)
                                    )}
                                </td>
                                <td className="p-4 text-center">{actionButtons}</td>
                            </tr>
                        )
                    }
                    
                    // Render multi-leg strategies as expandable rows
                    const isExpanded = expandedStrategies.has(strategy.id);
                    const plColor = strategy.totalPL > 0 ? 'text-green-400' : strategy.totalPL < 0 ? 'text-red-400' : 'text-gray-300';
                    const strategyTicker = strategy.legs.every(l => l.ticker === strategy.legs[0].ticker) ? strategy.legs[0].ticker : null;
                    const underlyingPrice = strategyTicker ? stockData[strategyTicker]?.price : undefined;

                    return (
                        <React.Fragment key={strategy.id}>
                            <tr onClick={() => toggleExpand(strategy.id)} className="hover:bg-gray-700/50 transition-colors cursor-pointer">
                                <td className="p-4 font-bold flex items-center gap-2">
                                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    {strategy.name}
                                </td>
                                <td className="p-4 font-mono">
                                    {strategyTicker ? (
                                        isLoading && underlyingPrice === undefined ? <div className="flex justify-start"><Shimmer/></div> : formatCurrency(underlyingPrice)
                                    ) : '—'}
                                </td>
                                <td className="p-4">{strategy.openDate}</td>
                                <td className="p-4" colSpan={6}>
                                    <span className="text-sm text-gray-400">{strategy.legs.length} leg(s)</span>
                                </td>
                                <td className="p-4 text-right font-mono">
                                    {formattedMargin}
                                </td>
                                <td className={`p-4 text-right font-bold ${plColor}`}>
                                    {isLoading ? <div className="flex justify-end"><Shimmer /></div> : formatCurrency(strategy.totalPL, true)}
                                </td>
                                <td className="p-4 text-center">{actionButtons}</td>
                            </tr>
                            {isExpanded && strategy.legs.map(leg => (
                                <LegRow key={leg.id} leg={leg} isLoading={isLoading} underlyingPrice={stockData[leg.ticker]?.price} />
                            ))}
                        </React.Fragment>
                    );
                })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default PortfolioTable;