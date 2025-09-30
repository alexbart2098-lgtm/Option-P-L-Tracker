import React from 'react';

const ExtendRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
    <path d="M2 12h16" />
    <path d="M14 8l4 4-4 4" />
  </svg>
);

export default ExtendRightIcon;