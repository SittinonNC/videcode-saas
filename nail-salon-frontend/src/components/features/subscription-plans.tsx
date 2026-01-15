"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "BASIC",
    name: "Basic",
    price: 299,
    period: "/เดือน",
    description: "เหมาะสำหรับร้านขนาดเล็ก",
    features: [
      "พนักงานได้สูงสุด 3 คน",
      "บริการได้สูงสุด 10 รายการ",
      "ระบบจองออนไลน์",
      "รายงานพื้นฐาน",
    ],
    recommended: false,
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    price: 599,
    period: "/เดือน",
    description: "เหมาะสำหรับร้านขนาดกลาง",
    features: [
      "พนักงานได้สูงสุด 10 คน",
      "บริการไม่จำกัด",
      "ระบบจองออนไลน์",
      "รายงานขั้นสูง",
      "รับชำระด้วยสลิป",
      "แจ้งเตือนผ่าน LINE",
    ],
    recommended: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 1299,
    period: "/เดือน",
    description: "สำหรับร้านขนาดใหญ่หรือหลายสาขา",
    features: [
      "พนักงานไม่จำกัด",
      "บริการไม่จำกัด",
      "หลายสาขา",
      "รายงานขั้นสูง + Export",
      "รับชำระด้วยสลิป + PromptPay",
      "แจ้งเตือนผ่าน LINE",
      "Priority Support",
      "API Access",
    ],
    recommended: false,
  },
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelect?: (planId: string) => void;
}

export function SubscriptionPlans({
  currentPlan,
  onSelect,
}: SubscriptionPlansProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrentPlan =
          currentPlan?.toUpperCase() === plan.id.toUpperCase();

        return (
          <Card
            key={plan.id}
            className={cn(
              "relative flex flex-col",
              plan.recommended && "border-primary shadow-lg"
            )}
          >
            {plan.recommended && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                แนะนำ
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ฿{plan.price.toLocaleString()}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isCurrentPlan ? (
                <Button variant="outline" className="w-full" disabled>
                  แพ็กเกจปัจจุบัน
                </Button>
              ) : (
                <Button
                  variant={plan.recommended ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onSelect?.(plan.id)}
                >
                  เลือกแพ็กเกจนี้
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
