"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen flex flex-col p-8">
      <main className="flex-1">
        <div className="container py-8">
          <Alert className="mb-8 border-primary/50 bg-primary/5 text-primary">
            <AlertTitle>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Welcome, {session?.user?.name || "User"}!
              </h1>
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
