import React, { useState, useMemo } from 'react';
import { WatchlistItem } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface WatchlistProps {
  tickers: string[];
  items: WatchlistItem[];
  openPositionTickers: Set<string>;
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onOpenChart: (ticker: string) => void;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatChange = (value: number, isPercent: boolean) => {
    const sign = value > 0 ? '+' : '';
    const formatted = isPercent ? value.toFixed(2) + '%' : formatCurrency(value);
    return sign + formatted;
};

type WatchlistTab = 'open' | 'favourites' | 'add';

const Watchlist: React.FC<WatchlistProps> = ({ tickers, items, openPositionTickers, onAddTicker, onRemoveTicker, onOpenChart, isLoading }) => {
    const [newTicker, setNewTicker] = useState('');
    const [activeTab, setActiveTab] = useState<WatchlistTab>('open');
    
    const itemsMap = useMemo(() => new Map(items.map(item => [item.ticker, item])), [items]);
    
    const { openTickers, favouriteTickers } = useMemo(() => {
        const open: string[] = [];
        const fav: string[] = [];
        tickers.forEach(t => {
            if (openPositionTickers.has(t)) {
                open.push(t);
            } else {
                fav.push(t);
            }
        });
        return { openTickers: open, favouriteTickers: fav };
    }, [tickers, openPositionTickers]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTicker.trim()) {
            onAddTicker(newTicker.trim());
            setNewTicker('');
            setActiveTab('favourites');
        }
    };
    
    const TabButton: React.FC<{tab: WatchlistTab, children: React.ReactNode}> = ({ tab, children }) => {
        const isActive = activeTab === tab;
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-transparent text-gray-300 hover:bg-gray-700'
                }`}
                aria-current={isActive}
            >
                {children}
            </button>
        );
    };
    
    const tickersToDisplay = activeTab === 'open' ? openTickers : favouriteTickers;
    const showShimmer = isLoading && tickersToDisplay.length === 0;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-100">Watchlist</h2>
                <div className="flex items-center gap-1 p-1 bg-gray-900/50 rounded-lg">
                    <TabButton tab="open">Open Positions</TabButton>
                    <TabButton tab="favourites">Favourites</TabButton>
                    <TabButton tab="add">+ Add New</TabButton>
                </div>
            </div>

            {activeTab === 'add' ? (
                <form onSubmit={handleAdd} className="flex gap-2 my-6">
                    <input
                        type="text"
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                        placeholder="Add ticker (e.g., TSLA)"
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none placeholder-gray-400"
                        aria-label="Add stock to watchlist"
                    />
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                        aria-label="Add ticker to watchlist"
                    >
                        <PlusIcon /> Add
                    </button>
                </form>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-700/50">
                            <tr>
                                <th className="p-3 font-semibold text-gray-400 uppercase text-xs tracking-wider">Ticker</th>
                                <th className="p-3 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right">Price</th>
                                <th className="p-3 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right">Change</th>
                                <th className="p-3 font-semibold text-gray-400 uppercase text-xs tracking-wider text-center" aria-label="Actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {showShimmer && [...Array(3)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-700/50">
                                    <td className="p-3"><div className="animate-pulse bg-gray-600 h-5 w-16 rounded-md"></div></td>
                                    <td className="p-3 text-right"><div className="animate-pulse bg-gray-600 h-5 w-20 rounded-md ml-auto"></div></td>
                                    <td className="p-3 text-right"><div className="animate-pulse bg-gray-600 h-5 w-24 rounded-md ml-auto"></div></td>
                                    <td className="p-3 text-center"><div className="animate-pulse bg-gray-600 h-5 w-5 rounded-md mx-auto"></div></td>
                                </tr>
                            ))}
                            {!isLoading && tickersToDisplay.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-400">
                                        {activeTab === 'open' 
                                            ? "No open positions with trackable tickers."
                                            : "Your watchlist is empty. Add a ticker to start."
                                        }
                                    </td>
                                </tr>
                            )}
                            {!showShimmer && tickersToDisplay.map(ticker => {
                                const item = itemsMap.get(ticker);
                                const color = item ? (item.change > 0 ? 'text-green-400' : item.change < 0 ? 'text-red-400' : 'text-gray-300') : 'text-gray-300';
                                
                                if (!item && isLoading) {
                                    return (
                                        <tr key={ticker} className="border-b border-gray-700/50 last:border-b-0">
                                            <td className="p-3 font-bold text-lg">{ticker}</td>
                                            <td className="p-3 text-right"><div className="animate-pulse bg-gray-600 h-5 w-20 rounded-md ml-auto"></div></td>
                                            <td className="p-3 text-right"><div className="animate-pulse bg-gray-600 h-5 w-24 rounded-md ml-auto"></div></td>
                                            <td className="p-3 w-12">&nbsp;</td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={ticker} className="border-b border-gray-700/50 last:border-b-0">
                                        <td className="p-3 font-bold text-lg">
                                            <button 
                                                onClick={() => onOpenChart(ticker)} 
                                                className="hover:text-green-400 transition-colors"
                                                title={`View chart for ${ticker}`}
                                            >
                                                {ticker}
                                            </button>
                                        </td>
                                        <td className="p-3 text-right font-mono">
                                            {item ? formatCurrency(item.price) : 'N/A'}
                                        </td>
                                        <td className={`p-3 text-right font-mono ${color}`}>
                                            {item ? `${formatChange(item.change, false)} (${formatChange(item.changePercent, true)})` : 'N/A'}
                                        </td>
                                        <td className="p-3 text-center w-12">
                                            {activeTab === 'favourites' && (
                                                <button onClick={() => onRemoveTicker(ticker)} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Remove from watchlist" aria-label={`Remove ${ticker} from watchlist`}>
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Watchlist;