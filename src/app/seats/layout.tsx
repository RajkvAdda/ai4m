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

  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);
  const sequence = useSequence();
  useEffect(() => {
    if (sequence == SequenceEnum.admin) {
      router.push("/admin");
    }
  }, [sequence]);
  return <div>{children}</div>;
}
