

import React, { useState } from 'react';

interface ApiKeyInputProps {
  onSave: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
      <form onSubmit={handleSave} className="space-y-3">
        <div>
            <strong className="font-bold text-lg">Action Required: Set Your Polygon.io API Key</strong>
            <p className="mt-1">To fetch live market data, you need a free API key from Polygon.io.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your Polygon.io API Key here"
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none placeholder-gray-400"
            aria-label="Polygon.io API Key"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Save Key
          </button>
        </div>

        <div className="text-sm text-yellow-300 mt-2 p-3 bg-yellow-900/40 rounded-md border border-yellow-800/50">
          <p className="font-bold text-yellow-200">How to find your key:</p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Log in to your <a href="https://polygon.io/dashboard/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-100 font-semibold">Polygon.io Dashboard</a> and go to the "API Keys" section.</li>
              <li>Click on your key to see the details.</li>
              <li>Make sure you are viewing the <strong className="font-semibold text-yellow-100">"Accessing the API"</strong> tab, not "Accessing Flat Files (S3)". The image you provided showed the S3 tab.</li>
              <li>Your API key will be a long string of characters. Copy and paste it above.</li>
          </ol>
        </div>
      </form>
    </div>
  );
};

export default ApiKeyInput;