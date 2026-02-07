import { Card, CardContent } from "@/components/ui/card";
import { cn, getDateFormat, getNameFistKey } from "@/lib/utils";

import React, { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IUser } from "@/types/user";
import { H6 } from "@/components/ui/typography";
import { IUserActivity } from "@/types/userActivity";

export default function UserActivity({
  date,
  users,
}: {
  date: string;
  users: IUser[];
}) {
  const [userActivity, setUserActivity] = React.useState<IUserActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchUserActivity = async () => {
      setLoading(true);
      try {
        console.log("Fetching user activity for date:", date);
        const res = await fetch(
          `/api/useractivity?createdAt=${getDateFormat(new Date(date), "yyyy-MM-dd")}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        setUserActivity(data?.data);
      } finally {
        setLoading(false);
      }
    };
    if (date) fetchUserActivity();
  }, [date]);

  const groupedByUserName = userActivity.reduce<
    Record<string, IUserActivity[]>
  >((acc, activity) => {
    const user = users.find((u) => u.id === activity.userId);
    const userName = user?.name || "Unknown User";
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(activity);
    return acc;
  }, {});

  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <table className="w-full">
            <tbody>
              {Object.entries(groupedByUserName).map(
                ([userName, activities]) => {
                  const user = users.find((u) => u.name === userName);
                  return (
                    <tr
                      key={userName}
                      className={cn("border-b border-emerald-200")}
                    >
                      <td
                        style={{ minWidth: "180px", width: "180px" }}
                        className="p-2 border-r border-emerald-200 flex items-center  gap-2"
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={user?.avator} alt={user?.name} />
                          <AvatarFallback
                            className={cn(
                              "bg-emerald-100 text-emerald-800 text-xs",
                              user?.role == "GST" &&
                                "bg-blue-100 text-blue-800",
                              user?.role == "Intern" &&
                                "bg-orange-100 text-orange-600",
                            )}
                          >
                            {getNameFistKey(user?.name)}{" "}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate max-w-[100px] sm:max-w-none">
                          <H6>{userName}</H6>
                        </div>
                        <div className="truncate max-w-[100px] sm:max-w-none">
                          <H6>{userName}</H6>
                        </div>
                      </td>
                      <td className="p-2">
                        {activities.length > 0 ? (
                          <ActivityList activities={activities} users={users} />
                        ) : (
                          <div
                            className={cn(
                              "text-sm text-muted-foreground py-1",
                              loading ? "animate-pulse" : "",
                            )}
                          >
                            No Activities Found
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityList({ activities }: { activities: IUserActivity[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || isPaused) return;

    let animationId: number;
    let scrollPosition = 0;

    const isMobile =
      window.matchMedia && window.matchMedia("(max-width: 640px)").matches;

    const scroll = () => {
      if (isMobile) {
        scrollPosition += 0.5;
        if (scrollPosition >= scrollElement.scrollHeight / 2) {
          scrollPosition = 0;
        }
        scrollElement.scrollTop = scrollPosition;
      } else {
        scrollPosition += 0.5;
        if (scrollPosition >= scrollElement.scrollWidth / 2) {
          scrollPosition = 0;
        }
        scrollElement.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, activities]);

  return (
    <div
      ref={scrollRef}
      className="flex sm:flex-row flex-col gap-3 overflow-x-hidden  max-h-[120px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Duplicate bookings for seamless infinite scroll */}
      {[...activities, ...(activities?.length > 3 ? activities : [])].map(
        (activity, index) => {
          return (
            <div
              key={`${activity.id}-${index}`}
              className={cn(
                "flex items-center gap-2 bg-emerald-50 rounded-lg p-2 min-w-fit border border-emerald-200",
                (activity.status.includes("CANCELLED") ||
                  activity.status.includes("DELETED")) &&
                  "bg-red-100 border-red-300",
                activity.status.includes("BOOKED") &&
                  "bg-green-100 border-green-300",
              )}
            >
              <span className="text-gray-500 text-sm">
                {`${activity.status.replaceAll("_", " ")} for date `}
                <b>{getDateFormat(new Date(activity.date))}</b>
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}
