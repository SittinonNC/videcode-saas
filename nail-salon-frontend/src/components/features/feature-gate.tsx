"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useSubscription } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ArrowRight } from "lucide-react";
import { PlanLimits } from "@/lib/plan-limits";

interface FeatureGateProps {
  feature: keyof PlanLimits;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature } = useSubscription();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return fallback || null;
}

interface LimitGateProps {
  type: "staff" | "service";
  currentCount: number;
  children: ReactNode;
  onUpgrade?: () => void;
}

export function LimitGate({
  type,
  currentCount,
  children,
  onUpgrade,
}: LimitGateProps) {
  const { canAddStaff, canAddService, limits, plan } = useSubscription();

  const canAdd =
    type === "staff" ? canAddStaff(currentCount) : canAddService(currentCount);
  const maxLimit = type === "staff" ? limits.maxStaff : limits.maxServices;
  const itemName = type === "staff" ? "พนักงาน" : "บริการ";

  if (canAdd) {
    return <>{children}</>;
  }

  return (
    <UpgradePrompt
      title={`ถึงจำนวน${itemName}สูงสุดแล้ว`}
      description={`แพ็กเกจ ${plan} รองรับ${itemName}ได้สูงสุด ${
        maxLimit === Infinity ? "ไม่จำกัด" : maxLimit
      } รายการ`}
      onUpgrade={onUpgrade}
    />
  );
}

interface UpgradePromptProps {
  title: string;
  description: string;
  onUpgrade?: () => void;
}

export function UpgradePrompt({
  title,
  description,
  onUpgrade,
}: UpgradePromptProps) {
  return (
    <Card className="border-accent bg-accent/5">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="p-3 rounded-full bg-accent/20">
          <Lock className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {onUpgrade ? (
          <Button onClick={onUpgrade} size="sm">
            อัพเกรด
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Link href="/dashboard/settings?tab=subscription">
            <Button size="sm">
              อัพเกรด
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

interface PlanBadgeProps {
  showUpgrade?: boolean;
}

export function PlanBadge({ showUpgrade = true }: PlanBadgeProps) {
  const { plan, limits, status } = useSubscription();

  const planColors: Record<string, string> = {
    TRIAL: "bg-gray-100 text-gray-800",
    BASIC: "bg-blue-100 text-blue-800",
    PROFESSIONAL: "bg-primary/20 text-primary",
    ENTERPRISE: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[plan]}`}
      >
        {plan}
      </span>
      {showUpgrade && plan !== "ENTERPRISE" && (
        <Link
          href="/dashboard/settings?tab=subscription"
          className="text-xs text-primary hover:underline"
        >
          อัพเกรด
        </Link>
      )}
    </div>
  );
}
