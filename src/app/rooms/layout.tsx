"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function RoomLayput({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);
  return <div>{children}</div>;
}
