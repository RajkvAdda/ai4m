"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Check } from "lucide-react";
import { User } from "next-auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUpcomingWednesdayWeekNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const weekdays = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed_even", label: "Wednesday (SPP)" },
  { value: "Wed_odd", label: "Wednesday (GST)" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
];

const bookingSchema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one user"),
  weekdays: z.array(z.string()).optional(),
  startDate: z.string(),
  endDate: z.string(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  onSuccess: () => void;
  users: User[];
  fromDate: Date;
  toDate: Date;
}

export function BookingForm({
  onSuccess,
  users,
  fromDate,
  toDate,
}: BookingFormProps) {
  const { toast } = useToast();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<string>("All");

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      userIds: [],
      weekdays: [],
      startDate: fromDate,
      endDate: toDate,
    },
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSelection = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      form.setValue("userIds", newSelection);

      return newSelection;
    });
  };

  const selectAllUsers = () => {
    const allUserIds = users
      .filter((user) => group === "All" || user.role === group)
      .map((user) => user.id);
    setSelectedUsers(allUserIds);
    form.setValue("userIds", allUserIds);
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setLoading(true);

      console.log("Submitting booking data:", data);

      const response = await fetch("/api/admin/bulk-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create bookings");
      }

      const result = await response.json();
      toast({
        title: `Successfully created ${result.bookingsCreated} bookings!`,
        description: "You do not have permission to book for this date.",
        variant: "success",
      });

      // Reset form
      setSelectedUsers([]);
      form.reset();

      onSuccess();
    } catch (error) {
      console.error("Booking error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create bookings";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Usage:
  const upcomingWednesdayInfo = getUpcomingWednesdayWeekNumber();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Bulk Seat Booking Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Selection */}
            <FormField
              control={form.control}
              name="userIds"
              render={() => (
                <FormItem>
                  <div className="flex items-center gap-2 justify-between">
                    <div>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Select Team Members
                      </FormLabel>
                      <FormDescription>
                        Choose multiple users for seat booking
                      </FormDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedUsers.length > 0 ? (
                        <>
                          <Badge variant="secondary">
                            {selectedUsers.length} selected
                          </Badge>
                          <Badge
                            variant="default"
                            className="cursor-pointer"
                            onClick={() => setSelectedUsers([])}
                          >
                            Clear
                          </Badge>
                        </>
                      ) : (
                        <Badge
                          variant="default"
                          className="cursor-pointer"
                          onClick={() => selectAllUsers()}
                        >
                          Select All
                        </Badge>
                      )}
                      <Tabs
                        defaultValue="All"
                        value={group}
                        onValueChange={setGroup}
                      >
                        <TabsList>
                          <TabsTrigger value="All">
                            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                              {users.length}
                            </Badge>
                            All
                          </TabsTrigger>
                          <TabsTrigger value="SPP">
                            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                              {
                                users.filter((user) => user.role === "SPP")
                                  .length
                              }
                            </Badge>
                            SPP
                          </TabsTrigger>
                          <TabsTrigger value="GST">
                            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                              {
                                users.filter((user) => user.role === "GST")
                                  .length
                              }
                            </Badge>
                            GST
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  <FormControl>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {users
                          .filter(
                            (user) => group === "All" || user.role === group,
                          )
                          .map((user) => (
                            <div
                              key={user.id}
                              onClick={() => toggleUser(user.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                selectedUsers.includes(user.id)
                                  ? "bg-primary/10 border-2 border-primary"
                                  : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                              }`}
                            >
                              <div
                                className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                                  selectedUsers.includes(user.id)
                                    ? "bg-primary border-primary"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedUsers.includes(user.id) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weekday Selection */}
            <FormField
              control={form.control}
              name="weekdays"
              render={() => (
                <FormItem>
                  <FormLabel>Select Weekdays</FormLabel>
                  <FormDescription>
                    Choose which days of the week to book seats (upcoming
                    Wednesday is{" "}
                    {upcomingWednesdayInfo.weekNumber % 2 === 0
                      ? "Even"
                      : "Odd"}{" "}
                    Week )
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3  mb-2">
                    {weekdays.map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="weekdays"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={day.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value || []),
                                          day.value,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.value,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || selectedUsers.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Bookings...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Bulk Bookings
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
