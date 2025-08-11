import React from 'react';

const IconLogo = () => (
  <svg id="logo" xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 84 96">
    <title>Logo</title>
    <g transform="translate(-8.000000, -2.000000)">
      <g transform="translate(11.000000, 5.000000)">
        <polygon
          id="Shape"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="39 0 0 22 0 67 39 90 78 68 78 23"
        />
        <text
          x="39"
          y="45"              // tweak this number to perfectly center vertically
          fontSize="40"
          fill="currentColor"
          fontFamily="Verdana"
          textAnchor="middle"         // center horizontally on x
          dominantBaseline="middle"   // center vertically on y
        >
          N
        </text>
      </g>
    </g>
  </svg>
);

export default IconLogo;
