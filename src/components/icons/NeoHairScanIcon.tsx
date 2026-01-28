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
      {/* Scan corners - cantos arredondados */}
      <path d="M7.5 5H5.5a.5.5 0 0 0-.5.5v2" />
      <path d="M16.5 5h2a.5.5 0 0 1 .5.5v2" />
      <path d="M7.5 19H5.5a.5.5 0 0 1-.5-.5v-2" />
      <path d="M16.5 19h2a.5.5 0 0 0 .5-.5v-2" />

      {/* Ponto central */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
