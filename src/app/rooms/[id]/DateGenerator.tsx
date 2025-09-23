import { Button } from "@/components/ui/button";
import { getDateFormat, isSameDay } from "@/lib/utils";
import React from "react";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DateSelector = ({ selectedDate, onDateChange }) => {
  const dateOptions = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    let dayLabel = "";
    if (i === 0) {
      dayLabel = "Today";
    } else if (i === 1) {
      dayLabel = "Tomorrow";
    } else {
      dayLabel = weekdays[date.getDay()];
    }

    const dateNumber = date.getDate();

    dateOptions.push({
      label: dayLabel,
      dateNum: dateNumber,
      date: getDateFormat(date),
    });
  }
  console.log("dateOptions", dateOptions);
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center">
      {dateOptions.map((option) => (
        <Button
          key={option.label}
          {...(isSameDay(new Date(selectedDate), new Date(option.date))
            ? {
                variant: "default",
              }
            : { variant: "outline" })}
          onClick={() => onDateChange(option.date)}
          className={`h-fit min-w-[120px]`}
        >
          <div className="grid grid-cols-1 items-center">
            <div className="text-center ">{option.label}</div>
            <div className="text-center font-extrabold text-xl">
              {option.dateNum}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};
