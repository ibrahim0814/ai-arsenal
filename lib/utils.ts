import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serializeTool(tool: any) {
  return {
    ...tool,
    id: tool.id.toString(), // Convert BigInt to string
  };
}

export const formatTagLabel = (tag: string) => {
  return tag
    .split(/[-\s]/) // Split by hyphen or space
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
