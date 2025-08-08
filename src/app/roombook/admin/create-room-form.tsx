"use client";

import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef } from "react";

import { createRoomAction } from "@/app/actions";
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

const roomSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["table", "bench", "free_area"], {
    required_error: "Please select a room type.",
  }),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  seatsPerUnit: z.coerce
    .number()
    .int()
    .min(1, "Must have at least 1 seat per unit"),
});

export default function CreateRoomForm() {
  const [state, formAction] = useFormState(createRoomAction, { message: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof roomSchema>>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      units: 1,
      seatsPerUnit: 1,
    },
  });

  useEffect(() => {
    if (state.message && !state.errors) {
      toast({
        title: "Room Created",
        description: state.message,
      });
      form.reset();
    }
    if (state.errors) {
      // You can add more specific error handling here if needed
    }
  }, [state, form, toast]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Create a New Room</CardTitle>
        <CardDescription>
          Define the properties of a new room for users to book.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form ref={formRef} action={formAction} className="space-y-4">
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
                      <SelectItem value="bench">Bench</SelectItem>
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
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create Room"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
