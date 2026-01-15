export type SubscriptionPlan =
  | "TRIAL"
  | "BASIC"
  | "PROFESSIONAL"
  | "ENTERPRISE";

export interface PlanLimits {
  maxStaff: number;
  maxServices: number;
  slipVerification: boolean;
  lineNotification: boolean;
  multiBranch: boolean;
  apiAccess: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  TRIAL: {
    maxStaff: 2,
    maxServices: 5,
    slipVerification: false,
    lineNotification: false,
    multiBranch: false,
    apiAccess: false,
  },
  BASIC: {
    maxStaff: 3,
    maxServices: 10,
    slipVerification: false,
    lineNotification: false,
    multiBranch: false,
    apiAccess: false,
  },
  PROFESSIONAL: {
    maxStaff: 10,
    maxServices: Infinity,
    slipVerification: true,
    lineNotification: true,
    multiBranch: false,
    apiAccess: false,
  },
  ENTERPRISE: {
    maxStaff: Infinity,
    maxServices: Infinity,
    slipVerification: true,
    lineNotification: true,
    multiBranch: true,
    apiAccess: true,
  },
};

export function getPlanLimits(plan: SubscriptionPlan | undefined): PlanLimits {
  return PLAN_LIMITS[plan || "TRIAL"];
}

export function canAddStaff(
  plan: SubscriptionPlan | undefined,
  currentCount: number
): boolean {
  const limits = getPlanLimits(plan);
  return currentCount < limits.maxStaff;
}

export function canAddService(
  plan: SubscriptionPlan | undefined,
  currentCount: number
): boolean {
  const limits = getPlanLimits(plan);
  return currentCount < limits.maxServices;
}

export function hasFeature(
  plan: SubscriptionPlan | undefined,
  feature: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}
