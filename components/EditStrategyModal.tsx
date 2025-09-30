

import React, { useState, useEffect } from 'react';
import { OptionStrategy, OptionStrategyInput, OptionLegInput, OptionType, OptionAction, Account } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface EditStrategyModalProps {
  strategy: OptionStrategy;
  onSave: (strategyId: string, data: OptionStrategyInput) => void;
  onCancel: () => void;
  accounts: Account[];
}

const EditStrategyModal: React.FC<EditStrategyModalProps> = ({ strategy, onSave, onCancel, accounts }) => {
  const [strategyName, setStrategyName] = useState(strategy.name);
  const [legs, setLegs] = useState<OptionLegInput[]>(strategy.legs);
  const [accountId, setAccountId] = useState(strategy.accountId);
  const [openDate, setOpenDate] = useState(strategy.openDate || '');
  const [errors, setErrors] = useState<{ strategy?: string; account?: string, openDate?: string, legs: Record<number, Record<string, string>> }>({ legs: {} });

  const initialLegState: OptionLegInput = {
    ticker: legs[0]?.ticker || '',
    type: OptionType.CALL,
    action: OptionAction.BUY,
    strike: 0,
    expiration: '',
    purchasePrice: 0,
    contracts: 1,
  };

  useEffect(() => {
    setStrategyName(strategy.name);
    setAccountId(strategy.accountId);
    setOpenDate(strategy.openDate || new Date().toISOString().split('T')[0]);
    setLegs(strategy.legs.map(leg => {
      const { id, currentPrice, pl, ...legInput } = leg;
      return legInput;
    }));
  }, [strategy]);

  const validate = (): boolean => {
    const newErrors: { strategy?: string; account?: string, openDate?: string, legs: Record<number, Record<string, string>> } = { legs: {} };
    if (!strategyName.trim()) newErrors.strategy = 'Strategy name is required';
    if (!accountId) newErrors.account = 'Please select an account';
    if (!openDate) newErrors.openDate = 'Open date is required';
    legs.forEach((leg, index) => {
        const legErrors: Record<string, string> = {};
        if (!leg.ticker.trim()) legErrors.ticker = 'Ticker is required';
        if (leg.strike <= 0) legErrors.strike = 'Strike must be positive';
        if (!leg.expiration) legErrors.expiration = 'Date is required';
        if (leg.purchasePrice <= 0) legErrors.purchasePrice = 'Price must be positive';
        if (leg.contracts <= 0) legErrors.contracts = 'Contracts must be positive';
        if (Object.keys(legErrors).length > 0) newErrors.legs[index] = legErrors;
    });
    setErrors(newErrors);
    return !newErrors.strategy && !newErrors.account && !newErrors.openDate && Object.keys(newErrors.legs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(strategy.id, { name: strategyName, legs, accountId, openDate });
    }
  };

  const handleLegChange = (index: number, field: keyof OptionLegInput, value: any) => {
    const newLegs = [...legs];
    const leg = { ...newLegs[index] };
    switch (field) {
        case 'ticker': leg.ticker = value.toUpperCase(); break;
        case 'strike': case 'purchasePrice': case 'contracts': leg[field] = parseFloat(value) || 0; break;
        default: (leg as any)[field] = value; break;
    }
    newLegs[index] = leg;
    setLegs(newLegs);
  };
  
  const addLeg = () => setLegs(prev => [...prev, initialLegState]);
  const removeLeg = (index: number) => setLegs(legs.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-100">Edit Strategy</h2>
        <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <label htmlFor="strategyName" className="block mb-2 font-semibold text-gray-400">Strategy Name</label>
                    <input type="text" id="strategyName" value={strategyName} onChange={(e) => setStrategyName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" required />
                    {errors.strategy && <p className="text-red-400 text-sm mt-1">{errors.strategy}</p>}
                </div>
                <div>
                    <label htmlFor="accountId" className="block mb-2 font-semibold text-gray-400">Account</label>
                    <select id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none">
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.broker})</option>
                        ))}
                    </select>
                     {errors.account && <p className="text-red-400 text-sm mt-1">{errors.account}</p>}
                </div>
                <div>
                    <label htmlFor="editOpenDate" className="block mb-2 font-semibold text-gray-400">Open Date</label>
                    <input type="date" id="editOpenDate" value={openDate} onChange={(e) => setOpenDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    {errors.openDate && <p className="text-red-400 text-sm mt-1">{errors.openDate}</p>}
                </div>
            </div>

            {legs.map((leg, index) => {
                const legErrors = errors.legs[index] || {};
                return (
                    <fieldset key={index} className="border border-gray-700 p-4 rounded-lg">
                        <legend className="px-2 text-lg font-semibold text-gray-300 flex items-center gap-4">
                            Leg {index + 1}
                            {legs.length > 1 && <button type="button" onClick={() => removeLeg(index)} className="text-red-400 hover:text-red-300"><TrashIcon /></button>}
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                            <div className="flex flex-col"><label className="mb-2 font-semibold text-gray-400">Ticker</label><input type="text" value={leg.ticker} onChange={(e) => handleLegChange(index, 'ticker', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white" />{legErrors.ticker && <p className="text-red-400 text-sm mt-1">{legErrors.ticker}</p>}</div>
                            <div className="flex flex-col"><label className="mb-2 font-semibold text-gray-400">Action</label><select value={leg.action} onChange={(e) => handleLegChange(index, 'action', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white appearance-none"><option value={OptionAction.BUY}>Buy</option><option value={OptionAction.SELL}>Sell</option></select></div>
                            <div className="flex flex-col"><label className="mb-2 font-semibold text-gray-400">Type</label><select value={leg.type} onChange={(e) => handleLegChange(index, 'type', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white appearance-none"><option value={OptionType.CALL}>Call</option><option value={OptionType.PUT}>Put</option></select></div>
                            <div className="flex flex-col"><label className="mb-2 font-semibold text-gray-400">Strike</label><input type="number" value={leg.strike} onChange={(e) => handleLegChange(index, 'strike', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white" />{legErrors.strike && <p className="text-red-400 text-sm mt-1">{legErrors.strike}</p>}</div>
                            <div className="flex flex-col"><label className="mb-2 font-semibold text-gray-400">Expiration</label><input type="date" value={leg.expiration} onChange={(e) => handleLegChange(index, 'expiration', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white" />{legErrors.expiration && <p className="text-red-400 text-sm mt-1">{legErrors.expiration}</p>}</div>
                            <div className="flex flex-col md:col-span-2"><label className="mb-2 font-semibold text-gray-400">Premium</label><div className="grid grid-cols-2 gap-4 items-start"><div><input type="number" value={leg.purchasePrice} onChange={(e) => handleLegChange(index, 'purchasePrice', e.target.value)} step="any" min="0" className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white" /><p className="text-xs text-gray-500 mt-1">Per Share</p>{legErrors.purchasePrice && <p className="text-red-400 text-sm mt-1">{legErrors.purchasePrice}</p>}</div><div><input type="number" value={Number((leg.purchasePrice * leg.contracts * 100).toPrecision(15))} onChange={(e) => { const total = parseFloat(e.target.value); if (!isNaN(total) && leg.contracts > 0) handleLegChange(index, 'purchasePrice', (total / (leg.contracts * 100)).toString()); }} step="any" min="0" className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white" /><p className="text-xs text-gray-500 mt-1">Total</p></div></div></div>
                            <div className="flex flex-col"><label className="mb-2 font-semibold text-gray-400">Contracts</label><input type="number" value={leg.contracts} onChange={(e) => handleLegChange(index, 'contracts', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white" />{legErrors.contracts && <p className="text-red-400 text-sm mt-1">{legErrors.contracts}</p>}</div>
                        </div>
                    </fieldset>
                )
            })}
             <div className="flex justify-between items-center gap-4 mt-4">
                <button type="button" onClick={addLeg} className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-green-300 border border-green-600 hover:bg-green-600/20 transition-colors"><PlusIcon /> Add Leg</button>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">Save Changes</button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditStrategyModal;