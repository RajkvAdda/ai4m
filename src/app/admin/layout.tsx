"use client";
import { Alert } from "@/components/ui/alert";
import { BackButton } from "@/components/ui/button";
import UserAvator from "@/components/user-avator";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { status, data: session } = useSession();

  const loginEmail = "kumarshivaray@gmail.com";
  // console.log("AdminLayout session:", session);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (
      loginEmail !== "kumarshivaray@gmail.com" &&
      session?.user.email !== "naveenbgowda@gmail.com"
    ) {
      router.push("/");
    }
  }, [router, status, session]);
  return (
    <div className="min-h-screen flex flex-col p-1 sm:p-4 md:p-8">
      <main className="flex-1">
        <div className="container px-2 sm:px-4">
          <Alert className="mb-4 border-primary/50 text-primary flex gap-3 items-center flex-wrap justify-between">
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
