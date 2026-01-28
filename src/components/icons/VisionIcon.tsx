import * as React from "react";

import { cn } from "@/lib/utils";

export type VisionIconProps = React.SVGProps<SVGSVGElement>;

/**
 * VisionIcon
 * Ícone vetorial próprio (SVG) para o portal Vision.
 * Mantém o mesmo "peso"/estilo dos ícones Lucide (stroke currentColor, 24x24).
 */
export function VisionIcon({ className, ...props }: VisionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      width="24"
      height="24"
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    >
      {/* Scan corners */}
      <path d="M7 3H5a2 2 0 0 0-2 2v2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
      
      {/* V central */}
      <path d="M8 7l4 8 4-8" strokeWidth={2.5} fill="none" />
    </svg>
  );
}
