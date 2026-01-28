import * as React from "react";

import { cn } from "@/lib/utils";

export type NeoHairScanIconProps = React.SVGProps<SVGSVGElement>;

/**
 * NeoHairScanIcon
 * Ícone vetorial próprio (SVG) para o portal NeoHairScan.
 * Mantém o mesmo “peso”/estilo dos ícones Lucide (stroke currentColor, 24x24).
 */
export function NeoHairScanIcon({ className, ...props }: NeoHairScanIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    >
      {/* Scan corners (maiores para aparecer bem em 24px) */}
      <path d="M7 4H4v3" />
      <path d="M17 4h3v3" />
      <path d="M7 20H4v-3" />
      <path d="M17 20h3v-3" />

      {/* Scan line */}
      <path d="M7.25 12h9.5" />

      {/* Follicle marker */}
      <circle cx="12" cy="16.5" r="1.35" />

      {/* Hair strands */}
      <path d="M12 15.1V8.5" />
      <path d="M10.2 14.6c.2-2.4 1.1-4.3 2.6-6.1" />
      <path d="M13.8 14.6c-.2-2.4-1.1-4.3-2.6-6.1" />

      {/* Pequeno "spark" (IA) */}
      <path d="M16.2 9.2l.9-.9" />
      <path d="M16.2 8.3l.9.9" />
    </svg>
  );
}
