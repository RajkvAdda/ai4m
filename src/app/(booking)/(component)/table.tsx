import { IconButton } from "@/components/ui/icon";
import { Armchair, Plus } from "lucide-react";
import React from "react";

export default function BookingTable({
  units,
  seatsPerUnit,
  onAddUnit,
}: {
  units: number;
  seatsPerUnit: number;
  onAddUnit: () => void;
}) {
  return (
    <div>
      {Array.from({ length: units })?.map((index) => (
        <div key={index} className="flex flex-wrap items-center gap-4 mb-4">
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
              ></div>
            </div>
            <div className="rounded-lg p-1 px-3 flex gap-4 justify-between rotate-180">
              <Armchair size={30} />
              <Armchair size={30} />
              <Armchair size={30} />
              <Armchair size={30} />
            </div>
          </div>
          {units - 1 == index ? (
            <IconButton iconName="Plus" onClick={() => onAddUnit()} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
