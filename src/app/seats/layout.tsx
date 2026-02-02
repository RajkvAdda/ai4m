"use client";
import { SequenceEnum, useSequence } from "@/hooks/useSequence";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function RoomLayput({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { status, data: session } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);
  const sequence = useSequence();

  useEffect(() => {
    if (
      sequence == SequenceEnum.admin ||
      session?.user.email == "kumarshivaray@gmail.com" ||
      session?.user.email == "naveenbgowda@gmail.com"
    ) {
      router.push("/admin");
    }
  }, [sequence, session]);
  return <div>{children}</div>;
}
