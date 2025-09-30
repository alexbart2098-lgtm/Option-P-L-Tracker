

import React, { useState } from 'react';
import { OptionStrategy } from '../types';

interface RollStrategyModalProps {
  strategy: OptionStrategy;
  onSave: (strategyId: string, rollData: { newStrike: number; newExpiration: string; rollPremium: number }) => void;
  onCancel: () => void;
}

const RollStrategyModal: React.FC<RollStrategyModalProps> = ({ strategy, onSave, onCancel }) => {
  const leg = strategy.legs[0]; // This modal is only for single-leg strategies
  const [newStrike, setNewStrike] = useState(leg.strike);
  const [newExpiration, setNewExpiration] = useState(leg.expiration);
  const [rollPremium, setRollPremium] = useState(0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(strategy.id, { newStrike, newExpiration, rollPremium });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-lg mx-4">
        <h2 className="text-2xl font-bold mb-2 text-gray-100">Roll Position</h2>
        <p className="text-gray-400 mb-6">Rolling from: <span className="font-semibold text-gray-200">{leg.ticker} ${leg.strike} {leg.type}</span></p>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="newStrike" className="block mb-2 font-semibold text-gray-400">New Strike Price</label>
            <input 
              type="number" 
              id="newStrike" 
              value={newStrike}
              onChange={(e) => setNewStrike(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" 
              required
            />
          </div>
          <div>
            <label htmlFor="newExpiration" className="block mb-2 font-semibold text-gray-400">New Expiration Date</label>
            <input 
              type="date" 
              id="newExpiration" 
              value={newExpiration}
              onChange={(e) => setNewExpiration(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" 
              required
            />
          </div>
          <div>
            <label htmlFor="rollPremium" className="block mb-2 font-semibold text-gray-400">Net Credit / Debit from Roll</label>
            <input 
              type="number" 
              step="0.01"
              id="rollPremium" 
              value={rollPremium}
              onChange={(e) => setRollPremium(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="e.g., 0.50 for credit, -0.25 for debit"
              required
            />
             <p className="text-xs text-gray-500 mt-1">Enter a positive value for a credit (e.g., 0.50) or a negative value for a debit (e.g., -0.25).</p>
          </div>
          
          <div className="flex justify-end items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Confirm Roll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RollStrategyModal;