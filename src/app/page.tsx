"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  useEffect(() => {
    if (status !== "unauthenticated") {
      router.push("/rooms");
    } else {
      router.push("/auth/login");
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
  );
}
