
import React from 'react';

interface SortIconProps {
  direction: 'ascending' | 'descending' | 'none';
}

const SortIcon: React.FC<SortIconProps> = ({ direction }) => {
  const isAsc = direction === 'ascending';
  const isDesc = direction === 'descending';
  const isNone = direction === 'none';

  return (
    <div className="flex flex-col items-center justify-center w-4 h-4">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-2.5 w-2.5 -mb-1 ${isAsc ? 'text-white' : isNone ? 'text-gray-500' : 'text-gray-600'}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-2.5 w-2.5 -mt-1 ${isDesc ? 'text-white' : isNone ? 'text-gray-500' : 'text-gray-600'}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
};

export default SortIcon;
