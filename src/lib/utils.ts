import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class lists and resolve Tailwind conflicts.
 * Use for components where multiple Tailwind utilities may target the same property.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
