

import React, { useState, useEffect } from 'react';
import { ApiProvider, ApiKeys } from '../types';
import { validateApiKey as validateAlphaVantage } from '../services/alphaVantageService';
import { validateApiKeys as validateAlpaca } from '../services/alpacaService';
import CheckCircleIcon from './icons/CheckCircleIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ApiSettingsModalProps {
  currentProvider: ApiProvider;
  currentKeys: ApiKeys;
  onSave: (provider: ApiProvider, keys: ApiKeys) => void;
  onCancel: () => void;
}

type ValidationState = 'idle' | 'loading' | 'success' | 'error';

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ currentProvider, currentKeys, onSave, onCancel }) => {
  const [provider, setProvider] = useState<ApiProvider>(currentProvider);
  const [alphaVantageKey, setAlphaVantageKey] = useState(currentKeys.alphaVantage || '');
  const [alpacaKey, setAlpacaKey] = useState(currentKeys.alpacaKey || '');
  const [alpacaSecret, setAlpacaSecret] = useState(currentKeys.alpacaSecret || '');
  
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  // Reset validation state if keys or provider change
  useEffect(() => {
    setValidationState('idle');
    setValidationMessage('');
  }, [provider, alphaVantageKey, alpacaKey, alpacaSecret]);

  const handleTestConnection = async () => {
    setValidationState('loading');
    setValidationMessage('');
    let result: { success: boolean, message: string };

    if (provider === 'alphaVantage') {
        result = await validateAlphaVantage(alphaVantageKey);
    } else {
        result = await validateAlpaca(alpacaKey, alpacaSecret);
    }
    
    setValidationMessage(result.message);
    setValidationState(result.success ? 'success' : 'error');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationState !== 'success') {
        // This should not happen if button is disabled, but as a safeguard
        setValidationState('error');
        setValidationMessage('Please test the connection successfully before saving.');
        return;
    }
    onSave(provider, {
      alphaVantage: alphaVantageKey,
      alpacaKey: alpacaKey,
      alpacaSecret: alpacaSecret,
    });
  };

  const renderValidationStatus = () => {
    if (validationState === 'idle') return null;

    if (validationState === 'loading') {
        return <div className="flex items-center gap-2 text-gray-400"><RefreshIcon className="animate-spin" /><span>Validating...</span></div>;
    }

    const isSuccess = validationState === 'success';
    const colorClass = isSuccess ? 'text-green-400' : 'text-red-400';
    const Icon = isSuccess ? CheckCircleIcon : AlertTriangleIcon;

    return (
        <div className={`flex items-center gap-2 ${colorClass}`}>
            <Icon className="h-5 w-5" />
            <span className="font-semibold">{validationMessage}</span>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-100">API Provider Settings</h2>
        
        <form onSubmit={handleSave} className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-300 mb-2">Select Data Provider</legend>
            
            {/* Alpha Vantage Option */}
            <div className={`p-4 rounded-lg border-2 transition-colors ${provider === 'alphaVantage' ? 'border-green-500 bg-gray-700/50' : 'border-gray-600 bg-gray-900/30'}`}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="apiProvider"
                  value="alphaVantage"
                  checked={provider === 'alphaVantage'}
                  onChange={() => setProvider('alphaVantage')}
                  className="h-5 w-5 text-green-600 bg-gray-700 border-gray-500 focus:ring-green-500"
                />
                <span className="ml-3 text-lg font-semibold text-gray-200">Alpha Vantage + AI Simulation</span>
              </label>
              <p className="ml-8 mt-1 text-sm text-gray-400">
                Uses Alpha Vantage for stock prices and AI to simulate option prices. Good for a free, quick setup.
              </p>
              {provider === 'alphaVantage' && (
                <div className="ml-8 mt-4">
                  <label htmlFor="alphaVantageKey" className="block mb-2 font-semibold text-gray-400">Alpha Vantage API Key</label>
                  <input
                    type="text"
                    id="alphaVantageKey"
                    value={alphaVantageKey}
                    onChange={(e) => setAlphaVantageKey(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                    placeholder="Enter your Alpha Vantage key"
                  />
                   <p className="text-xs text-gray-500 mt-1">Get a free key from <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="underline">alphavantage.co</a>.</p>
                </div>
              )}
            </div>

            {/* Alpaca Option */}
            <div className={`p-4 rounded-lg border-2 transition-colors ${provider === 'alpaca' ? 'border-green-500 bg-gray-700/50' : 'border-gray-600 bg-gray-900/30'}`}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="apiProvider"
                  value="alpaca"
                  checked={provider === 'alpaca'}
                  onChange={() => setProvider('alpaca')}
                  className="h-5 w-5 text-green-600 bg-gray-700 border-gray-500 focus:ring-green-500"
                />
                <span className="ml-3 text-lg font-semibold text-gray-200">Alpaca Market Data</span>
              </label>
              <p className="ml-8 mt-1 text-sm text-gray-400">
                Uses Alpaca for real-time stock and option prices. Recommended for accuracy. Requires an Alpaca account.
              </p>
              {provider === 'alpaca' && (
                <div className="ml-8 mt-4 space-y-4">
                  <div>
                    <label htmlFor="alpacaKey" className="block mb-2 font-semibold text-gray-400">Alpaca API Key ID</label>
                    <input
                      type="text"
                      id="alpacaKey"
                      value={alpacaKey}
                      onChange={(e) => setAlpacaKey(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                      placeholder="Enter your Alpaca Key ID"
                    />
                  </div>
                  <div>
                    <label htmlFor="alpacaSecret" className="block mb-2 font-semibold text-gray-400">Alpaca Secret Key</label>
                    <input
                      type="password"
                      id="alpacaSecret"
                      value={alpacaSecret}
                      onChange={(e) => setAlpacaSecret(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                      placeholder="Enter your Alpaca Secret Key"
                    />
                  </div>
                   <p className="text-xs text-gray-500 mt-1">Find your keys in your <a href="https://app.alpaca.markets/paper/dashboard/overview" target="_blank" rel="noopener noreferrer" className="underline">Alpaca dashboard</a>.</p>
                </div>
              )}
            </div>
          </fieldset>
          
          <div className="flex justify-between items-center gap-4 pt-4">
            <div>
                {renderValidationStatus()}
            </div>
            <div className="flex items-center gap-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">Cancel</button>
                <button 
                  type="button" 
                  onClick={handleTestConnection} 
                  disabled={validationState === 'loading'}
                  className="px-6 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-500"
                >
                  Test Connection
                </button>
                <button 
                  type="submit" 
                  disabled={validationState !== 'success'}
                  className="px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                  title={validationState !== 'success' ? 'Please test connection successfully first' : 'Save API settings'}
                >
                  Save Settings
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiSettingsModal;