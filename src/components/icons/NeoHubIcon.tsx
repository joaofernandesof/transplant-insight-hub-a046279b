import React from "react";

interface NeoHubIconProps {
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * NeoHub Icon — rounded square representing the integrated ecosystem.
 * Styled to match Lucide icon conventions.
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
      {/* Rounded square base */}
      <rect x="3" y="3" width="18" height="18" rx="5" />
      {/* Inner rounded square - filled with opacity for depth */}
      <rect x="7" y="7" width="10" height="10" rx="3" fill={color} fillOpacity="0.35" stroke="none" />
    </svg>
  );
}

export default NeoHubIcon;
