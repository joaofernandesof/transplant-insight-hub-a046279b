import React from "react";

interface NeoHubIconProps {
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * NeoHub Icon — represents an ecosystem of interconnected systems.
 * A central hub node with orbiting satellite nodes connected by lines,
 * styled to match Lucide icon conventions.
 */
export function NeoHubIcon({ 
  size = 24, 
  className, 
  color = "currentColor",
  strokeWidth = 2 
}: NeoHubIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Central hub circle */}
      <circle cx="12" cy="12" r="3" />
      
      {/* Orbital ring */}
      <circle cx="12" cy="12" r="8" strokeDasharray="2 3" strokeWidth={strokeWidth * 0.6} opacity="0.4" />
      
      {/* Satellite nodes with connections */}
      {/* Top */}
      <line x1="12" y1="9" x2="12" y2="4.5" />
      <circle cx="12" cy="3.5" r="1.5" />
      
      {/* Bottom-right */}
      <line x1="14.6" y1="13.5" x2="18" y2="17" />
      <circle cx="19" cy="18" r="1.5" />
      
      {/* Bottom-left */}
      <line x1="9.4" y1="13.5" x2="6" y2="17" />
      <circle cx="5" cy="18" r="1.5" />
      
      {/* Right */}
      <line x1="15" y1="12" x2="19" y2="12" />
      <circle cx="20.5" cy="12" r="1.5" />
      
      {/* Left */}
      <line x1="9" y1="12" x2="5" y2="12" />
      <circle cx="3.5" cy="12" r="1.5" />
    </svg>
  );
}

export default NeoHubIcon;
