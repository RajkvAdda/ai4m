"use client";

// import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef } from "react";

// import { createRoomAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { IRoom } from "@/modals/Room";
import BookingTable from "../(component)/table";
const roomZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["table", "row", "free_area"]),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  seatsPerUnit: z.coerce
    .number()
    .int()
    .min(1, "Must have at least 1 seat per unit"),
});

export default function CreateRoomForm({
  room,
  onRoomChange,
}: {
  room?: IRoom;
  onRoomChange?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof roomZodSchema>>({
    resolver: zodResolver(roomZodSchema),
    defaultValues: room
      ? {
          name: room.name,
          type: room.type,
          units: room.units,
          seatsPerUnit: room.seatsPerUnit,
        }
      : {
          name: "",
          type: "table",
          units: 1,
          seatsPerUnit: 1,
        },
  });

  async function onSubmit(values: z.infer<typeof roomZodSchema>) {
    try {
      let res, data;
      if (room && room._id) {
        res = await fetch(`/api/rooms/${room._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        data = await res.json();
        if (res.ok) {
          toast({
            title: "Room Updated",
            description: data.message,
          });
          if (onRoomChange) onRoomChange();
        } else {
          toast({
            title: "Error",
            description: data.error
              ? JSON.stringify(data.error)
              : "Failed to update room.",
            variant: "destructive",
          });
        }
      } else {
        res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        data = await res.json();
        if (res.ok) {
          toast({
            title: "Room Created",
            description: data.message,
          });
          form.reset();
          if (onRoomChange) onRoomChange();
        } else {
          toast({
            title: "Error",
            description: data.error
              ? JSON.stringify(data.error)
              : "Failed to create room.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  console.log("rj-admin", form);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Create a New Room</CardTitle>
        <CardDescription>
          Define the properties of a new room for users to book.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Library" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="row">Row</SelectItem>
                      <SelectItem value="free_area">Free Area</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.getValues("type") == "table" ? (
              <BookingTable
                units={form.getValues("units")}
                seatsPerUnit={form.getValues("seatsPerUnit")}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seatsPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seats/Unit</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? room
                  ? "Updating..."
                  : "Creating..."
                : room
                ? "Update Room"
                : "Create Room"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
