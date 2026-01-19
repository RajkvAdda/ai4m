"use client";

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Check } from "lucide-react";
import { toast } from "sonner";

const weekdays = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
];

const bookingSchema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one user"),
  weekdays: z.array(z.string()).optional(),
  specificDay: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface User {
  id: string;
  name: string;
  email: string;
}

interface BookingFormProps {
  onSuccess: () => void;
}

export function BookingForm({ onSuccess }: BookingFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      userIds: [],
      weekdays: [],
      specificDay: undefined,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 2))
        .toISOString()
        .split("T")[0],
    },
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      console.log(data, "rj-users");
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSelection = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      form.setValue("userIds", newSelection);
      return newSelection;
    });
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setLoading(true);

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
      toast.success(`Successfully created ${result.bookingsCreated} bookings!`);

      // Reset form
      setSelectedUsers([]);
      form.reset();

      onSuccess();
    } catch (error) {
      console.error("Booking error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create bookings";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
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
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Team Members
                  </FormLabel>
                  <FormDescription>
                    Choose multiple users for seat booking
                  </FormDescription>
                  <FormControl>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {users.map((user) => (
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
                      )}
                    </div>
                  </FormControl>
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUsers.map((userId) => {
                        const user = users.find((u) => u.id === userId);
                        return (
                          <Badge key={userId} variant="secondary">
                            {user?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
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
                    Choose which days of the week to book seats
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

            {/* Specific Day Pattern */}
            <FormField
              control={form.control}
              name="specificDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specific Day Pattern (Optional)</FormLabel>
                  <FormDescription>
                    Select a specific day for recurring bookings (e.g., every
                    Wednesday)
                  </FormDescription>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {weekdays.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          Every {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
