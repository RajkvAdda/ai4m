"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user || session.user.role !== "admin") {
      router.push("/bookings");
    }
  }, [session, router]);

  return (
    <div className="min-h-screen flex flex-col p-8">
      <main className="flex-1">
        <div className="container py-8">
          <Alert className="mb-8 border-primary/50 bg-primary/5 text-primary">
            <AlertCircle className="h-4 w-4 !text-primary" />
            <AlertTitle>Admin Panel</AlertTitle>
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
