import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "div" | "section" | "header";
}

export function Card({ as: Component = "div", className, ...props }: CardProps) {
  return <Component className={cn("surface", className)} {...props} />;
}
