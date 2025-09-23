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
import { IRoom, roomTypeEnum, roomZodSchema } from "@/types/room";

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
          description: room.description,
          minBookingTime: room.minBookingTime,
          startTime: room.startTime,
          endTime: room.endTime,
        }
      : {
          name: "",
          type: room?.type || roomTypeEnum.open_room,
          description: "",
          minBookingTime: 30,
          startTime: 8 * 60,
          endTime: 20 * 60,
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., A cozy library with books."
                      {...field}
                    />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minBookingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Booking Time</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="24" {...field} />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="24" {...field} />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
