"use client";

import { Crown, CreditCard, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export default function SettingsPage() {
  const { user, userDoc } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const isPro = userDoc?.subscriptionStatus === "active" || userDoc?.subscriptionStatus === "trialing";

  async function handleUpgrade() {
    if (!user) return;
    setIsUpgrading(true);
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";
      const url = await createCheckoutSession(priceId, user.uid);
      if (url) window.location.href = url;
    } finally {
      setIsUpgrading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and subscription.</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Name</span>
            <span>{user?.displayName ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono text-xs">{user?.uid ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </CardTitle>
          <CardDescription>
            {isPro ? "You're on the Pro plan." : "You're on the Free plan — 5 posts per month."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current plan</span>
            <span className="font-semibold capitalize">
              {userDoc ? (isPro ? "Pro" : "Free") : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize">{userDoc?.subscriptionStatus ?? "—"}</span>
          </div>

          {!isPro && (
            <Button onClick={handleUpgrade} disabled={isUpgrading} className="w-full">
              {isUpgrading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crown className="mr-2 h-4 w-4" />
              )}
              Upgrade to Pro — $19/month
            </Button>
          )}

          {isPro && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-center text-primary font-medium">
              ✓ Pro plan active — unlimited posts
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
