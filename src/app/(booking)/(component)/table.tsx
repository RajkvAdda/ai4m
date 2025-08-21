import { Button } from "@/components/ui/button";
import { Armchair } from "lucide-react";
import React from "react";

export default function BookingTable({
  units,
  seatsPerUnit,
  onHandleUnit,
  onHandleSeatPerUnit,
}: {
  units: number;
  seatsPerUnit: number;
  onHandleUnit: (units: number) => void;
  onHandleSeatPerUnit: (seatsPerUnit: number) => void;
}) {
  console.log("object", seatsPerUnit, onHandleSeatPerUnit);
  return (
    <div>
      {Array.from({ length: units })?.map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 mb-4 p-2 rounded-sm bg-gray-100"
        >
          <div className="grid flex-1">
            <div className=" rounded-lg p-1 px-3 flex gap-4 justify-between">
              <Armchair size={30} />
              <Armchair size={30} />
              <Armchair size={30} />
              <Armchair size={30} />
            </div>
            <div className=" p-2 bg-gray-300 rounded-lg text-center">
              <div
                className="p-0 bg-gray-200 rounded-lg text-2xl"
                contentEditable
              >
                Table {index + 1}
              </div>
            </div>
            <div className="rounded-lg p-1 px-3 flex gap-4 justify-between rotate-180">
              <Armchair size={30} />
              <Armchair size={30} />
              <Armchair size={30} />
              <Armchair size={30} />
            </div>
          </div>
        </div>
      ))}
      <Button
        onClick={() => onHandleUnit(units + 1)}
        className="w-full"
        variant={"outline"}
      >
        Add Table
      </Button>
    </div>
  );
}
