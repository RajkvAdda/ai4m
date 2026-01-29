"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IUser } from "@/types/user";
import React, { use, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES } from "../users/[id]/page";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Users({ users }: { users: IUser[] }) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<IUser[]>(users);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All");
  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      // Remove the deleted user from the list
      setUsersList(usersList.filter((user) => user.id !== userId));

      toast.success(`${userName} has been deleted successfully`);
    } catch (error) {
      console.error("Delete user error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete user";
      toast.error(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Existing Users</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <Tabs defaultValue="All" value={group} onValueChange={setGroup}>
                <TabsList>
                  <TabsTrigger value="All">
                    <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                      {usersList.length}
                    </Badge>
                    All
                  </TabsTrigger>
                  <TabsTrigger value="User">
                    <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                      {
                        usersList.filter(
                          (user) =>
                            user.role === "User" || user.role === "user",
                        ).length
                      }
                    </Badge>
                    User
                  </TabsTrigger>
                  <TabsTrigger value="SPP">
                    <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                      {usersList.filter((user) => user.role === "SPP").length}
                    </Badge>
                    SPP
                  </TabsTrigger>
                  <TabsTrigger value="GST">
                    <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                      {usersList.filter((user) => user.role === "GST").length}
                    </Badge>
                    GST
                  </TabsTrigger>
                  <TabsTrigger value="Intern">
                    <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                      {
                        usersList.filter((user) => user.role === "Intern")
                          .length
                      }
                    </Badge>
                    Intern
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <input
                type="text"
                value={search}
                placeholder="Search by name..."
                className="px-3 py-2 border rounded-md text-sm"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  setSearch(searchTerm);
                }}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersList
                .filter(
                  (user) =>
                    group === "All" ||
                    user.role.toLowerCase() === group.toLowerCase(),
                )
                .filter((user) =>
                  user.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium p-2">
                      {user.name}
                    </TableCell>
                    <TableCell className="p-2">{user.email}</TableCell>
                    <TableCell className="p-1">
                      <Select
                        value={user.role}
                        onValueChange={async (newRole) => {
                          try {
                            const response = await fetch(
                              `/api/users/${user.id}`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ role: newRole }),
                              },
                            );

                            if (!response.ok) {
                              throw new Error("Failed to update role");
                            }

                            setUsersList(
                              usersList.map((u) =>
                                u.id === user.id ? { ...u, role: newRole } : u,
                              ),
                            );
                            toast.success(`Role updated to ${newRole}`);
                          } catch (error) {
                            console.error("Update role error:", error);
                            toast.error("Failed to update role");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right p-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete{" "}
                              <strong>{user.name}</strong> ({user.email}). This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteUser(user.id, user.name)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
