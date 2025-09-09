import { Alert } from "@/components/ui/alert";
import { BackButton } from "@/components/ui/button";
import UserAvator from "@/components/user-avator";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col p-8">
      <main className="flex-1">
        <div className="container">
          <Alert className="mb-4 border-primary/50 text-primary flex gap-3 items-center flex-wrap">
            <UserAvator
              discription="You have administrative privileges. Changes made here will
                  affect all users."
            />

            <div className="flex-1"></div>
            <BackButton />
          </Alert>

          {children}
        </div>
      </main>
    </div>
  );
}
