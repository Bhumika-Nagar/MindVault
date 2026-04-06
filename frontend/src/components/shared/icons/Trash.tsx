import type { SVGProps } from "react";

export function Trash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16M9 7V4h6v3M8 7l1 12h6l1-12" />
    </svg>
  );
}
