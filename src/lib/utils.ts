import { clsx, type ClassValue } from "clsx";
import { addDays, format, startOfDay } from "date-fns";
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

export function getTodayOrNextDate(afterHour: number = 10) {
  // Get current time and adjust to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const currentHour = Math.floor(istTime.getUTCHours());

  if (currentHour > afterHour) {
    const nextDay = addDays(now, 1);
    console.log("rj-time", now, currentHour, nextDay);
    return format(nextDay, "yyyy-MM-dd");
  }

  // Otherwise, return today's date
  return format(now, "yyyy-MM-dd");
}

export function getPreviousAndNextMonths(date: Date = new Date()) {
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const previousMonth = new Date(currentYear, currentMonth - 1, 1);
  const nextMonth = new Date(currentYear, currentMonth + 1, 1);

  return [previousMonth, new Date(currentYear, currentMonth, 1), nextMonth];
}

export function getMonthDays(
  month: number = new Date().getMonth(),
  year: number = new Date().getFullYear()
) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
}

export function getMonthFormat(date: Date = new Date()) {
  return format(date, "MMM");
}
export function getDateFormat(date: Date = new Date()) {
  return format(date, "yyyy-MM-dd");
}
