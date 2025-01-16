import { clsx, type ClassValue } from "clsx";
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
