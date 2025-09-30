import React from 'react';
import { Account } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onDeleteAccount: (accountId: string) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ accounts, selectedAccountId, onSelectAccount, onAddAccount, onDeleteAccount }) => {
  const canDelete = selectedAccountId !== 'all';
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="account-select" className="font-semibold text-gray-300">
          Viewing Account:
        </label>
        <div className="flex items-center gap-2">
            <select
            id="account-select"
            value={selectedAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none"
            disabled={accounts.length === 0}
            >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                {account.name} ({account.broker})
                </option>
            ))}
            </select>
            {canDelete && (
                <button 
                    onClick={() => onDeleteAccount(selectedAccountId)} 
                    className="p-2 text-red-400 hover:text-red-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                    title="Delete selected account"
                    aria-label="Delete selected account"
                >
                    <TrashIcon />
                </button>
            )}
        </div>
      </div>
      <button
        onClick={onAddAccount}
        className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        <PlusIcon />
        Add Account
      </button>
    </div>
  );
};

export default AccountSelector;