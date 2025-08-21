"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { H5 } from "@/components/ui/typography";
import { getNameFistKey } from "@/lib/utils";
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
          <Alert className="mb-8 border-primary/50 text-primary flex gap-3">
            <Avatar className="w-15 h-15 rounded-lg">
              <AvatarImage
                className="rounded-lg"
                src={session?.user?.image}
                alt={session?.user?.name}
              />
              <AvatarFallback className="rounded-lg">
                <H5>{getNameFistKey(session?.user?.name)}</H5>
              </AvatarFallback>
            </Avatar>
            <div>
              <AlertTitle className="text-3xl font-bold tracking-tight font-headline">
                Welcome, {session?.user?.name || "User"}!
              </AlertTitle>
              <AlertDescription>
                You have administrative privileges. Changes made here will
                affect all users.
              </AlertDescription>
            </div>
          </Alert>
          {children}
        </div>
      </main>
    </div>
  );
}
