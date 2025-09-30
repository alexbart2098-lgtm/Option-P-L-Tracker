

import React, { useState } from 'react';

interface AddAccountModalProps {
  onSave: (name: string, broker: string) => void;
  onCancel: () => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [broker, setBroker] = useState('');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !broker.trim()) {
      setError('Both account name and broker are required.');
      return;
    }
    onSave(name, broker);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-100">Add New Account</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="accountName" className="block mb-2 font-semibold text-gray-400">Account Name</label>
            <input 
              type="text" 
              id="accountName" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none" 
              placeholder="e.g., Roth IRA"
            />
          </div>
          <div>
            <label htmlFor="brokerName" className="block mb-2 font-semibold text-gray-400">Broker</label>
            <input 
              type="text" 
              id="brokerName" 
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="e.g., Fidelity"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end items-center gap-4 pt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
              Save Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;