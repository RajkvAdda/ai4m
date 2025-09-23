"use client";

// import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef } from "react";

// import { createSeatAction } from "@/app/actions";
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
import { ISeat, seatZodSchema } from "@/types/seat";

export default function CreateSeatForm({
  seat,
  onSeatChange,
}: {
  seat?: ISeat;
  onSeatChange?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof seatZodSchema>>({
    resolver: zodResolver(seatZodSchema),
    defaultValues: seat
      ? {
          name: seat.name,
          type: seat.type,
          description: seat.description,
          units: seat.units,
          seatsPerUnit: seat.seatsPerUnit,
        }
      : {
          name: "",
          type: "table",
          units: 1,
          seatsPerUnit: 1,
        },
  });

  async function onSubmit(values: z.infer<typeof seatZodSchema>) {
    try {
      let res, data;
      if (seat && seat._id) {
        res = await fetch(`/api/seats/${seat._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        data = await res.json();
        if (res.ok) {
          toast({
            title: "Seat Updated",
            description: data.message,
          });
          if (onSeatChange) onSeatChange();
        } else {
          toast({
            title: "Error",
            description: data.error
              ? JSON.stringify(data.error)
              : "Failed to update seat.",
            variant: "destructive",
          });
        }
      } else {
        res = await fetch("/api/seats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        data = await res.json();
        if (res.ok) {
          toast({
            title: "Seat Created",
            description: data.message,
          });
          form.reset();
          if (onSeatChange) onSeatChange();
        } else {
          toast({
            title: "Error",
            description: data.error
              ? JSON.stringify(data.error)
              : "Failed to create seat.",
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
        <CardTitle className="font-headline">Create a New Seat</CardTitle>
        <CardDescription>
          Define the properties of a new seat for users to book.
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
                  <FormLabel>Seat Name</FormLabel>
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
                  <FormLabel>Seat Description</FormLabel>
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
                  <FormLabel>Seat Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a seat type" />
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
              {form.formState.isSubmitting
                ? seat
                  ? "Updating..."
                  : "Creating..."
                : seat
                ? "Update Seat"
                : "Create Seat"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
