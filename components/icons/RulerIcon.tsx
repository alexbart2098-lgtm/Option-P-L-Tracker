
import React from 'react';

const RulerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M21.3 15.3l-6.6-6.6a.5.5 0 00-.71 0l-1.41 1.41a.5.5 0 000 .71l6.6 6.6a.5.5 0 00.71 0l1.41-1.41a.5.5 0 000-.71zM4.6 18.7L2.2 16.3a.5.5 0 010-.71l6.6-6.6a.5.5 0 01.71 0l1.41 1.41a.5.5 0 010 .71L4.6 18.7zM11 1l1 1M4 8l1 1M16 4l1 1M9 13l1 1M18 10l1 1M7 17l1 1"></path>
  </svg>
);

export default RulerIcon;