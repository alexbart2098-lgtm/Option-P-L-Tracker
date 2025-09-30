import React from 'react';
import AlertTriangleIcon from './icons/AlertTriangleIcon';

interface ConfirmDeleteAccountModalProps {
  accountName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteAccountModal: React.FC<ConfirmDeleteAccountModalProps> = ({ accountName, onConfirm, onCancel }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-red-700 w-full max-w-md mx-4">
        <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-900/50 p-3 rounded-full">
                <AlertTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100">Delete Account</h2>
        </div>
        
        <p className="text-gray-300 mb-6">
          Are you sure you want to permanently delete the account <strong className="text-white">"{accountName}"</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-end items-center gap-4 pt-4">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-2 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            className="px-6 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteAccountModal;