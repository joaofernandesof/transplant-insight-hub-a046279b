/**
 * CPG Advocacia Médica Logo - Versão Vetorizada SVG
 * Escudo com Caduceu
 */

import React from 'react';

interface IpromedLogoProps {
  className?: string;
  size?: number;
  variant?: 'navy' | 'gold' | 'bicolor';
}

const IpromedLogo: React.FC<IpromedLogoProps> = ({ 
  className = '', 
  size = 48,
  variant = 'bicolor'
}) => {
  // Color schemes
  const colors = {
    navy: {
      primary: '#1e3a5f',
      secondary: '#1e3a5f',
      accent: '#1e3a5f',
    },
    gold: {
      primary: '#C9A86C',
      secondary: '#B8956C',
      accent: '#D4B87C',
    },
    bicolor: {
      primary: '#1e3a5f',   // Navy for shield outline
      secondary: '#C9A86C', // Gold for snake
      accent: '#1e3a5f',    // Navy for caduceus staff
    },
  };

  const c = colors[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield Background */}
      <path
        d="M50 5
           C30 5 15 10 10 15
           C10 35 10 55 15 70
           C22 82 35 92 50 98
           C65 92 78 82 85 70
           C90 55 90 35 90 15
           C85 10 70 5 50 5Z"
        fill="white"
        stroke={c.primary}
        strokeWidth="3"
      />

      {/* Inner Shield Curve */}
      <path
        d="M50 12
           C35 12 23 16 18 20
           C18 38 18 52 22 64
           C28 74 38 82 50 87
           C62 82 72 74 78 64
           C82 52 82 38 82 20
           C77 16 65 12 50 12Z"
        fill="none"
        stroke={c.secondary}
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Caduceus Wings - Left */}
      <path
        d="M50 22
           C48 22 46 20 42 18
           C36 16 28 16 22 20
           C28 22 34 24 40 26
           C44 28 48 28 50 28Z"
        fill={c.primary}
      />

      {/* Caduceus Wings - Right */}
      <path
        d="M50 22
           C52 22 54 20 58 18
           C64 16 72 16 78 20
           C72 22 66 24 60 26
           C56 28 52 28 50 28Z"
        fill={c.primary}
      />

      {/* Caduceus Ball Top */}
      <circle
        cx="50"
        cy="18"
        r="4"
        fill={c.primary}
      />

      {/* Caduceus Staff */}
      <path
        d="M50 22
           L50 78"
        stroke={c.accent}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Snake Left - Wrapping around staff */}
      <path
        d="M50 30
           C42 32 38 36 38 40
           C38 44 42 48 50 48
           C42 50 38 54 38 58
           C38 62 42 66 50 68
           C42 70 38 72 40 76"
        fill="none"
        stroke={c.secondary}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Snake Right - Wrapping around staff */}
      <path
        d="M50 30
           C58 32 62 36 62 40
           C62 44 58 48 50 48
           C58 50 62 54 62 58
           C62 62 58 66 50 68
           C58 70 62 72 60 76"
        fill="none"
        stroke={c.secondary}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Snake Heads */}
      <circle cx="40" cy="76" r="2.5" fill={c.secondary} />
      <circle cx="60" cy="76" r="2.5" fill={c.secondary} />
    </svg>
  );
};

export default IpromedLogo;

// Export also as icon for use in menus
export const IpromedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IpromedLogo size={24} className={className} variant="bicolor" />
);
