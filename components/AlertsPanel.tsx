import React, { useState, useMemo } from 'react';
import { PriceAlert, AlertCondition, AlertStatus } from '../types';
import BellIcon from './icons/BellIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface AlertsPanelProps {
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'status' | 'createdAt'>) => void;
  onDeleteAlert: (alertId: string) => void;
  allWatchlistTickers: string[];
}

const AddAlertForm: React.FC<{
  onAdd: (alert: Omit<PriceAlert, 'id' | 'status' | 'createdAt'>) => void;
  allTickers: string[];
}> = ({ onAdd, allTickers }) => {
  const [ticker, setTicker] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<AlertCondition>(AlertCondition.ABOVE);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || !targetPrice || Number(targetPrice) <= 0) {
      setError('Please enter a valid ticker and a positive target price.');
      return;
    }
    setError('');
    onAdd({
      ticker: ticker.toUpperCase(),
      targetPrice: Number(targetPrice),
      condition,
    });
    setTicker('');
    setTargetPrice('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900/50 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="alert-ticker" className="block mb-2 text-sm font-semibold text-gray-400">Ticker</label>
          <input
            id="alert-ticker"
            type="text"
            list="ticker-suggestions"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="e.g., AAPL"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          />
          <datalist id="ticker-suggestions">
            {allTickers.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="alert-condition" className="block mb-2 text-sm font-semibold text-gray-400">Condition</label>
          <select
            id="alert-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as AlertCondition)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white appearance-none"
          >
            <option value={AlertCondition.ABOVE}>Price is Above</option>
            <option value={AlertCondition.BELOW}>Price is Below</option>
          </select>
        </div>
        <div>
          <label htmlFor="alert-price" className="block mb-2 text-sm font-semibold text-gray-400">Target Price</label>
          <input
            id="alert-price"
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            step="0.01"
            min="0"
            placeholder="e.g., 150.00"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          <PlusIcon /> Add Alert
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </form>
  );
};

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAddAlert, onDeleteAlert, allWatchlistTickers }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'triggered' | 'add'>('active');

  const { activeAlerts, triggeredAlerts } = useMemo(() => {
    const active: PriceAlert[] = [];
    const triggered: PriceAlert[] = [];
    alerts.forEach(alert => {
      if (alert.status === AlertStatus.ACTIVE) {
        active.push(alert);
      } else {
        triggered.push(alert);
      }
    });
    return {
      activeAlerts: active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      triggeredAlerts: triggered.sort((a, b) => new Date(b.triggeredAt!).getTime() - new Date(a.triggeredAt!).getTime()),
    };
  }, [alerts]);
  
  const TabButton: React.FC<{tab: 'active' | 'triggered' | 'add', children: React.ReactNode}> = ({ tab, children }) => {
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
  
  const renderAlertsList = (list: PriceAlert[]) => {
    if (list.length === 0) {
      return <p className="text-center py-8 text-gray-400">No {activeTab} alerts.</p>;
    }
    return (
      <ul className="space-y-2 p-2">
        {list.map(alert => (
          <li key={alert.id} className="grid grid-cols-4 items-center gap-4 p-3 bg-gray-900/50 rounded-md text-sm">
            <span className="font-bold text-lg col-span-1">{alert.ticker}</span>
            <span className="text-gray-300 col-span-2">
              Alert when price is <span className="font-semibold text-white">{alert.condition}</span>{' '}
              <span className="font-semibold text-green-400">${alert.targetPrice.toFixed(2)}</span>
            </span>
            <div className="flex items-center justify-end gap-2 text-gray-400">
               {alert.status === AlertStatus.TRIGGERED && alert.triggeredAt && (
                   <span className="text-xs">{new Date(alert.triggeredAt).toLocaleString()}</span>
               )}
               <button onClick={() => onDeleteAlert(alert.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete Alert">
                <TrashIcon />
               </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <BellIcon className="text-green-400 h-6 w-6"/>
          <h2 className="text-2xl font-bold text-gray-100">Price Alerts</h2>
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-900/50 rounded-lg">
          <TabButton tab="active">Active ({activeAlerts.length})</TabButton>
          <TabButton tab="triggered">Triggered ({triggeredAlerts.length})</TabButton>
          <TabButton tab="add">+ Add New</TabButton>
        </div>
      </div>

      {activeTab === 'add' && <AddAlertForm onAdd={onAddAlert} allTickers={allWatchlistTickers}/>}
      {activeTab === 'active' && renderAlertsList(activeAlerts)}
      {activeTab === 'triggered' && renderAlertsList(triggeredAlerts)}
    </div>
  );
};

export default AlertsPanel;
