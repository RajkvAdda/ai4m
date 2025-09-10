"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function Main() {
  const router = useRouter();
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status == "authenticated") {
      router.push("/rooms");
    }
  }, [router, status]);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
      <span className="text-lg font-semibold ">Loading...</span>
    </div>
  );
}
