

import React, { useState, useEffect } from 'react';
import { OptionLegInput, OptionStrategyInput, OptionType, OptionAction, Account } from '../types';
import { identifyStrategy } from '../services/strategyIdentifier';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface OptionFormProps {
  onSubmit: (data: OptionStrategyInput) => void;
  onCancel: () => void;
  accounts: Account[];
  selectedAccountId: string;
}

const initialLegState: OptionLegInput = {
  ticker: '',
  type: OptionType.CALL,
  action: OptionAction.BUY,
  strike: 0,
  expiration: '',
  purchasePrice: 0,
  contracts: 1,
};

const OptionForm: React.FC<OptionFormProps> = ({ onSubmit, onCancel, accounts, selectedAccountId }) => {
  const [strategyName, setStrategyName] = useState('');
  const [legs, setLegs] = useState<OptionLegInput[]>([initialLegState]);
  const [accountId, setAccountId] = useState(selectedAccountId === 'all' && accounts.length > 0 ? accounts[0].id : selectedAccountId);
  const [openDate, setOpenDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ strategy?: string; account?: string; openDate?: string; legs: Record<number, Record<string, string>> }>({ legs: {} });
  const [isNameManuallySet, setIsNameManuallySet] = useState(false);

  useEffect(() => {
    if (!isNameManuallySet) {
      const suggestedName = identifyStrategy(legs);
      setStrategyName(suggestedName);
    }
  }, [legs, isNameManuallySet]);

  if (accounts.length === 0) {
    return (
        <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700/50 text-center">
            <h3 className="text-xl font-semibold text-yellow-400">No Accounts Found</h3>
            <p className="text-gray-300 mt-2">Please add an account before creating a strategy.</p>
        </div>
    )
  }

  const validate = (): boolean => {
    const newErrors: { strategy?: string; account?: string; openDate?: string; legs: Record<number, Record<string, string>> } = { legs: {} };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name: strategyName, legs, accountId, openDate });
    }
  };
  
  const handleLegChange = (index: number, field: keyof OptionLegInput, value: string | number | OptionType | OptionAction) => {
    const newLegs = [...legs];
    const leg = { ...newLegs[index] };

    switch (field) {
      case 'ticker': leg.ticker = (value as string).toUpperCase(); break;
      case 'strike': case 'purchasePrice': case 'contracts': leg[field] = parseFloat(value as string) || 0; break;
      default: (leg as any)[field] = value; break;
    }
    
    newLegs[index] = leg;
    setLegs(newLegs);
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrategyName(e.target.value);
    setIsNameManuallySet(true);
  }

  const addLeg = () => {
    setLegs(prev => [...prev, { ...initialLegState, ticker: prev[0]?.ticker || '' }]);
  };

  const removeLeg = (index: number) => {
    const newLegs = legs.filter((_, i) => i !== index);
    setLegs(newLegs);
  };


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">Add New Strategy</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="strategyName" className="block mb-2 font-semibold text-gray-400">Strategy Name</label>
              <input type="text" id="strategyName" value={strategyName} onChange={handleNameChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="e.g., SPY Iron Condor" />
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
                <label htmlFor="openDate" className="block mb-2 font-semibold text-gray-400">Open Date</label>
                <input type="date" id="openDate" value={openDate} onChange={(e) => setOpenDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" />
                {errors.openDate && <p className="text-red-400 text-sm mt-1">{errors.openDate}</p>}
            </div>
        </div>
        
        {legs.map((leg, index) => {
          const priceLabel = leg.action === OptionAction.BUY ? 'Premium Paid' : 'Premium Received';
          const legErrors = errors.legs[index] || {};

          return (
            <fieldset key={index} className="border border-gray-700 p-4 rounded-lg">
              <legend className="px-2 text-lg font-semibold text-gray-300 flex items-center gap-4">
                Leg {index + 1}
                {legs.length > 1 && (
                    <button type="button" onClick={() => removeLeg(index)} className="text-red-400 hover:text-red-300">
                        <TrashIcon />
                    </button>
                )}
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                <div className="flex flex-col">
                    <label htmlFor={`ticker-${index}`} className="mb-2 font-semibold text-gray-400">Ticker Symbol</label>
                    <input type="text" name="ticker" id={`ticker-${index}`} value={leg.ticker} onChange={(e) => handleLegChange(index, 'ticker', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="e.g., AAPL" />
                    {legErrors.ticker && <p className="text-red-400 text-sm mt-1">{legErrors.ticker}</p>}
                </div>

                <div className="flex flex-col">
                    <label htmlFor={`action-${index}`} className="mb-2 font-semibold text-gray-400">Action</label>
                    <select name="action" id={`action-${index}`} value={leg.action} onChange={(e) => handleLegChange(index, 'action', e.target.value as OptionAction)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none">
                        <option value={OptionAction.BUY}>Buy</option>
                        <option value={OptionAction.SELL}>Sell</option>
                    </select>
                </div>
                
                <div className="flex flex-col">
                    <label htmlFor={`type-${index}`} className="mb-2 font-semibold text-gray-400">Option Type</label>
                    <select name="type" id={`type-${index}`} value={leg.type} onChange={(e) => handleLegChange(index, 'type', e.target.value as OptionType)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none">
                        <option value={OptionType.CALL}>Call</option>
                        <option value={OptionType.PUT}>Put</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label htmlFor={`strike-${index}`} className="mb-2 font-semibold text-gray-400">Strike Price</label>
                    <input type="number" name="strike" id={`strike-${index}`} value={leg.strike} onChange={(e) => handleLegChange(index, 'strike', e.target.value)} step="0.01" min="0" className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="e.g., 150.00" />
                    {legErrors.strike && <p className="text-red-400 text-sm mt-1">{legErrors.strike}</p>}
                </div>

                <div className="flex flex-col">
                    <label htmlFor={`expiration-${index}`} className="mb-2 font-semibold text-gray-400">Expiration Date</label>
                    <input type="date" name="expiration" id={`expiration-${index}`} value={leg.expiration} onChange={(e) => handleLegChange(index, 'expiration', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    {legErrors.expiration && <p className="text-red-400 text-sm mt-1">{legErrors.expiration}</p>}
                </div>
                
                <div className="flex flex-col md:col-span-2">
                    <label className="mb-2 font-semibold text-gray-400">{priceLabel}</label>
                    <div className="grid grid-cols-2 gap-4 items-start">
                        <div>
                            <input type="number" name="purchasePrice" id={`purchasePrice-${index}`} value={leg.purchasePrice} onChange={(e) => handleLegChange(index, 'purchasePrice', e.target.value)} step="any" min="0" className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder={leg.action === OptionAction.BUY ? 'e.g., 5.25' : 'e.g., 1.50'}/>
                            <p className="text-xs text-gray-500 mt-1">Per Share</p>
                            {legErrors.purchasePrice && <p className="text-red-400 text-sm mt-1">{legErrors.purchasePrice}</p>}
                        </div>
                        <div>
                            <input type="number" id={`totalPremium-${index}`} value={Number((leg.purchasePrice * leg.contracts * 100).toPrecision(15))} onChange={(e) => {
                                const total = parseFloat(e.target.value);
                                if (!isNaN(total) && leg.contracts > 0) handleLegChange(index, 'purchasePrice', (total / (leg.contracts * 100)).toString());
                            }} step="any" min="0" className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder={leg.action === OptionAction.BUY ? 'e.g., 525' : 'e.g., 150'}/>
                            <p className="text-xs text-gray-500 mt-1">Total</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <label htmlFor={`contracts-${index}`} className="mb-2 font-semibold text-gray-400">Number of Contracts</label>
                    <input type="number" name="contracts" id={`contracts-${index}`} value={leg.contracts} onChange={(e) => handleLegChange(index, 'contracts', e.target.value)} step="1" min="1" className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    {legErrors.contracts && <p className="text-red-400 text-sm mt-1">{legErrors.contracts}</p>}
                </div>
              </div>
            </fieldset>
          );
        })}
        
        <div className="flex justify-between items-center gap-4 mt-4">
            <button type="button" onClick={addLeg} className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-green-300 border border-green-600 hover:bg-green-600/20 transition-colors">
                <PlusIcon /> Add Another Leg
            </button>
            <div className="flex items-center gap-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">Add Strategy</button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default OptionForm;