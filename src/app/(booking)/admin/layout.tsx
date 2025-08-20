"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col p-8">
      <main className="flex-1">
        <div className="container">
          <Alert className="mb-8 border-primary/50 bg-primary/5 text-primary">
            <AlertTitle className="text-3xl font-bold tracking-tight font-headline">
              Welcome, {session?.user?.name || "User"}!
            </AlertTitle>
            <AlertDescription>
              You have administrative privileges. Changes made here will affect
              all users.
            </AlertDescription>
          </Alert>
          {children}
        </div>
      </main>
    </div>
  );
}
