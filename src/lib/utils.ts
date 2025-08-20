import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getName(fullName: string) {
  if (!fullName) return "";
  return fullName.trim().split(" ");
}

export function getNameFistKey(fullName: string) {
  if (!fullName) return "";
  return fullName
    .trim()
    .split(" ")
    ?.map((li) => li?.charAt(0).toUpperCase());
}
