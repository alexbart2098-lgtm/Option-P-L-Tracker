import React from 'react';

const MinimizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 4H4v6m16-6h-6v6M10 20H4v-6m16 6h-6v-6"
    />
  </svg>
);

export default MinimizeIcon;
