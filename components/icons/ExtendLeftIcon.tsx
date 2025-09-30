import React from 'react';

const ExtendLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
    >
    <path d="M22 12H6" />
    <path d="M10 8l-4 4 4 4" />
  </svg>
);

export default ExtendLeftIcon;