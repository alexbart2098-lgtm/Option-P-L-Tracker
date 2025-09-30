import React from 'react';

const FibIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3h18"></path>
    <path d="M3 8h18"></path>
    <path d="M3 13h18"></path>
    <path d="M3 18h18"></path>
    <path d="M4 3v18"></path>
    <path d="M20 3v18"></path>
  </svg>
);

export default FibIcon;