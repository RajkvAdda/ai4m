"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { H5 } from "./ui/typography";
import { getNameFistKey } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertDescription, AlertTitle } from "./ui/alert";
import { EditIcon } from "lucide-react";

export default function UserAvator({ discription }: { discription: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="flex gap-3 ">
      <div className="relative flex-shrink-0">
        <Avatar
          className="w-15 h-15 rounded-lg cursor-pointer hover:border-2 hover:border-gray-200"
          onClick={() => router.push("/users/" + session?.user?.id)}
        >
          <AvatarImage
            className="rounded-lg"
            src={session?.user?.image}
            alt={session?.user?.name}
          />
          <AvatarFallback className="rounded-lg">
            <H5>{getNameFistKey(session?.user?.name)}</H5>
          </AvatarFallback>
        </Avatar>
        <EditIcon
          className="absolute bottom-1 right-1 z-10 w-5 h-5 bg-black/60 text-white p-1 rounded-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/users/" + session?.user?.id);
          }}
        />
      </div>
      <div>
        <AlertTitle className="text-3xl font-bold tracking-tight font-headline">
          Welcome, {session?.user?.name || "User"}!
        </AlertTitle>
        <AlertDescription>{discription || ""}</AlertDescription>
      </div>
    </div>
  );
}
