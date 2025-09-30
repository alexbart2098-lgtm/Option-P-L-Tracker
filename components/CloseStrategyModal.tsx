import React, { useState, useMemo } from 'react';
import { OptionStrategy, OptionAction } from '../types';

interface CloseStrategyModalProps {
  strategy: OptionStrategy;
  onConfirmClose: (strategyId: string, closingLegs: { legId: string; price: number }[]) => void;
  onCancel: () => void;
}

const formatCurrency = (value: number) => {
  const options = { style: 'currency', currency: 'USD' };
  const formatted = new Intl.NumberFormat('en-US', options).format(value);
  return value > 0 ? `+${formatted}` : formatted;
}

const CloseStrategyModal: React.FC<CloseStrategyModalProps> = ({ strategy, onConfirmClose, onCancel }) => {
  const [closingPrices, setClosingPrices] = useState<Record<string, string>>(() => 
    Object.fromEntries(strategy.legs.map(leg => [leg.id, '']))
  );
  
  const handlePriceChange = (legId: string, value: string) => {
    setClosingPrices(prev => ({ ...prev, [legId]: value }));
  };

  const { finalPL, isReadyToClose } = useMemo(() => {
    let totalPL = 0;
    let allPricesEntered = true;

    for (const leg of strategy.legs) {
        const priceStr = closingPrices[leg.id];
        // FIX: Use Number() and isFinite() for stricter validation than parseFloat().
        // This prevents inputs like "1.5foo" from being treated as valid numbers.
        if (priceStr.trim() === '' || !isFinite(Number(priceStr))) {
            allPricesEntered = false;
            continue; // Can't calculate PL for this leg yet
        }
        const closingPrice = Number(priceStr);
        const costBasis = leg.purchasePrice * leg.contracts * 100;
        const closingValue = closingPrice * leg.contracts * 100;

        totalPL += leg.action === OptionAction.BUY
            ? closingValue - costBasis
            : costBasis - closingValue;
    }
    
    return { finalPL: totalPL, isReadyToClose: allPricesEntered };
  }, [closingPrices, strategy.legs]);


  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToClose) return;

    const closingLegs = Object.entries(closingPrices).map(([legId, price]) => ({
        legId,
        price: Number(price),
    }));
    onConfirmClose(strategy.id, closingLegs);
  };

  const plColor = finalPL > 0 ? 'text-green-400' : finalPL < 0 ? 'text-red-400' : 'text-gray-300';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-4">
        <h2 className="text-2xl font-bold mb-2 text-gray-100">Close Position</h2>
        <p className="text-gray-400 mb-6">Confirm closing prices for: <span className="font-semibold text-gray-200">{strategy.name}</span></p>
        
        <form onSubmit={handleConfirm} className="space-y-4">
          {strategy.legs.map(leg => (
            <div key={leg.id} className="grid grid-cols-3 items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
              <div className="col-span-2">
                <p className="font-semibold text-gray-200">{leg.ticker} ${leg.strike} {leg.type}</p>
                <p className="text-sm text-gray-400">{leg.action} {leg.contracts} contract(s)</p>
              </div>
              <div>
                <label htmlFor={`close-price-${leg.id}`} className="sr-only">Closing Price for {leg.ticker} ${leg.strike}</label>
                <input
                  type="number"
                  id={`close-price-${leg.id}`}
                  value={closingPrices[leg.id]}
                  onChange={(e) => handlePriceChange(leg.id, e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Close Price"
                  step="any"
                  min="0"
                  required
                />
              </div>
            </div>
          ))}

          {isReadyToClose && (
             <div className="pt-4 text-center">
                <p className="text-lg text-gray-400">Final Realized P/L</p>
                <p className={`text-3xl font-bold ${plColor}`}>
                    {formatCurrency(finalPL)}
                </p>
             </div>
          )}
          
          <div className="flex justify-end items-center gap-4 pt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">Cancel</button>
            <button type="submit" disabled={!isReadyToClose} className="px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              Confirm Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloseStrategyModal;