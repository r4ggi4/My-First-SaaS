"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { BlogGenerator } from "@/components/dashboard/blog-generator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, CalendarDays, CreditCard } from "lucide-react";
import { getUserPosts, getPostCountThisMonth } from "@/lib/firestore/posts";

export default function DashboardPage() {
  const { user, userDoc } = useAuth();
  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [monthlyPosts, setMonthlyPosts] = useState<number | null>(null);

  const isPro = userDoc?.subscriptionStatus === "active" || userDoc?.subscriptionStatus === "trialing";

  useEffect(() => {
    if (!user) return;
    getUserPosts(user.uid).then((posts) => setTotalPosts(posts.length));
    getPostCountThisMonth(user.uid).then(setMonthlyPosts);
  }, [user]);

  const displayName = user?.displayName ?? user?.email ?? "there";
  const postsRemaining = isPro ? null : Math.max(0, 5 - (monthlyPosts ?? 0));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {displayName}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your blog activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPosts ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPosts === 0 ? "Create your first post below" : "posts saved as drafts"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyPosts ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPro ? "Unlimited on Pro plan" : `${postsRemaining} remaining on Free plan`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {userDoc ? (isPro ? "Pro" : "Free") : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPro ? "All features unlocked" : "Upgrade to Pro for unlimited posts"}
            </p>
          </CardContent>
        </Card>
      </div>

      <BlogGenerator />
    </div>
  );
}
