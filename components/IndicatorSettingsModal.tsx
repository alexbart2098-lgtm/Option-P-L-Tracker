
import React, { useState, useEffect } from 'react';
import { IndicatorConfig, BollingerBandsSettings, StochasticRsiSettings } from '../types';

interface IndicatorSettingsModalProps {
  onSave: (config: IndicatorConfig) => void;
  onCancel: () => void;
  existingIndicator: IndicatorConfig | null;
}

const IndicatorSettingsModal: React.FC<IndicatorSettingsModalProps> = ({ onSave, onCancel, existingIndicator }) => {
  const [type, setType] = useState<'bollingerBands' | 'stochasticRSI'>(existingIndicator?.type || 'bollingerBands');
  
  const [bbSettings, setBbSettings] = useState<BollingerBandsSettings>(
    existingIndicator?.type === 'bollingerBands' 
      ? (existingIndicator.settings as BollingerBandsSettings) 
      : { period: 20, stdDev: 2 }
  );

  const [stochRsiSettings, setStochRsiSettings] = useState<StochasticRsiSettings>(
    existingIndicator?.type === 'stochasticRSI' 
      ? (existingIndicator.settings as StochasticRsiSettings) 
      : { rsiPeriod: 14, stochasticPeriod: 14, kPeriod: 3, dPeriod: 3 }
  );
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: IndicatorConfig = {
      id: existingIndicator?.id || `${type}-${Date.now()}`,
      type,
      settings: type === 'bollingerBands' ? bbSettings : stochRsiSettings
    };
    onSave(config);
  };
  
  const handleBBChange = (field: keyof BollingerBandsSettings, value: string) => {
      const numValue = parseInt(value, 10);
      if(numValue > 0) setBbSettings(prev => ({...prev, [field]: numValue}));
  }
  
  const handleStochRsiChange = (field: keyof StochasticRsiSettings, value: string) => {
      const numValue = parseInt(value, 10);
      if(numValue > 0) setStochRsiSettings(prev => ({...prev, [field]: numValue}));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" aria-modal="true" role="dialog">
      <div 
        className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-100">{existingIndicator ? 'Edit' : 'Add'} Indicator</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="indicator-type" className="block mb-2 font-semibold text-gray-400">Indicator Type</label>
            <select
              id="indicator-type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={!!existingIndicator}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none disabled:opacity-50"
            >
              <option value="bollingerBands">Bollinger Bands</option>
              <option value="stochasticRSI">Stochastic RSI</option>
            </select>
          </div>

          {type === 'bollingerBands' && (
            <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-300">Bollinger Bands Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bb-period" className="block mb-2 text-sm text-gray-400">Period</label>
                        <input type="number" id="bb-period" value={bbSettings.period} onChange={e => handleBBChange('period', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                     <div>
                        <label htmlFor="bb-stddev" className="block mb-2 text-sm text-gray-400">Std. Dev.</label>
                        <input type="number" id="bb-stddev" value={bbSettings.stdDev} onChange={e => handleBBChange('stdDev', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                </div>
            </div>
          )}

          {type === 'stochasticRSI' && (
            <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-300">Stochastic RSI Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="srsi-rsi" className="block mb-2 text-sm text-gray-400">RSI Period</label>
                        <input type="number" id="srsi-rsi" value={stochRsiSettings.rsiPeriod} onChange={e => handleStochRsiChange('rsiPeriod', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                     <div>
                        <label htmlFor="srsi-stoch" className="block mb-2 text-sm text-gray-400">Stochastic Period</label>
                        <input type="number" id="srsi-stoch" value={stochRsiSettings.stochasticPeriod} onChange={e => handleStochRsiChange('stochasticPeriod', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                     <div>
                        <label htmlFor="srsi-k" className="block mb-2 text-sm text-gray-400">%K Period</label>
                        <input type="number" id="srsi-k" value={stochRsiSettings.kPeriod} onChange={e => handleStochRsiChange('kPeriod', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                     <div>
                        <label htmlFor="srsi-d" className="block mb-2 text-sm text-gray-400">%D Period</label>
                        <input type="number" id="srsi-d" value={stochRsiSettings.dPeriod} onChange={e => handleStochRsiChange('dPeriod', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                </div>
            </div>
          )}

          <div className="flex justify-end items-center gap-4 pt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IndicatorSettingsModal;
