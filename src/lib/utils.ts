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

export function getTodayOrNextDate(afterHour: number = 19) {
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

export function getTodayDate() {
  return format(startOfDay(new Date()), "yyyy-MM-dd");
}

export function getNextDate(selectedDate: string) {
  const baseDate = selectedDate ? new Date(selectedDate) : new Date();
  const nextDay = addDays(baseDate, 1);
  return format(nextDay, "yyyy-MM-dd");
}
export function getPrevDate(selectedDate: string) {
  const baseDate = selectedDate ? new Date(selectedDate) : new Date();
  const prevDay = addDays(baseDate, -1);
  return format(prevDay, "yyyy-MM-dd");
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
  year: number = new Date().getFullYear(),
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
export function getDateFormat(
  date: Date = new Date(),
  formatStr: string = "yyyy-MM-dd",
) {
  return format(date, formatStr);
}

export function getIsBeforeDate(date1: string, date2: string) {
  return new Date(date1) <= new Date(date2);
}

export const formatTime = (t) => {
  if (!t) {
    return "-";
  }
  const [hour, minutes] = t.split(":");
  const hourInt = parseInt(hour, 10);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  const formattedHour = hourInt % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

export const timeToMinutes = (time: string) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper to convert minutes from midnight back to "HH:mm"
export const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const formatDate = (date: Date) => date.toISOString().split("T")[0];

export const isSameDay = (date1: Date, date2: Date) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const generateColorFromId = (id: string) => {
  if (!id) return "#cccccc";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 85%)`;
};

export function getUpcomingWednesday(): Date {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 3 = Wednesday
  const daysUntilWednesday = (3 - currentDay + 7) % 7 || 7;

  const upcomingWednesday = new Date(today);
  upcomingWednesday.setDate(today.getDate() + daysUntilWednesday);

  return upcomingWednesday;
}
// e.g., "Wed Jan 22 2026"
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function getUpcomingWednesdayWeekNumber(): {
  date: Date;
  weekNumber: number;
} {
  const wednesday = getUpcomingWednesday();
  return {
    date: wednesday,
    weekNumber: getWeekNumber(wednesday),
  };
}

// formatDate with UTC format
export const displayDateTime = (
  date: Date,
  formatStr: string = "dd-MMM-yyyy HH:mm",
) => {
  if (!date) return "";
  const utcDate = new Date(date.getTime());
  return format(utcDate, formatStr);
};
