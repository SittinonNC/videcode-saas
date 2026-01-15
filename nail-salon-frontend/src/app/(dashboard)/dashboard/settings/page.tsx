"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { tenantService } from "@/services/tenant.service";
import {
  useTenant,
  useUpdatePaymentSettings,
  useCreateSubscription,
} from "@/hooks/use-tenant";
import { useSubscription } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  CreditCard,
  Building2,
  Check,
  Loader2,
} from "lucide-react";
import { SubscriptionPlans } from "@/components/features/subscription-plans";
import { toast } from "sonner";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "general";
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useTenant();
  const { mutate: updateSettings, isPending } = useUpdatePaymentSettings();
  const { mutate: createSubscription, isPending: isCreatingSubscription } =
    useCreateSubscription();
  const { plan, limits, status } = useSubscription();

  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankAccountNo: "",
    bankAccountName: "",
  });

  useEffect(() => {
    if (tenant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBankForm({
        bankName: tenant.bankName || "",
        bankAccountNo: tenant.bankAccountNo || "",
        bankAccountName: tenant.bankAccountName || "",
      });
    }
  }, [tenant]);

  // Check for Stripe redirect success/cancel
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const ref = searchParams.get("ref");

    if (success === "true") {
      const verifyPayment = async () => {
        try {
          if (ref) {
            await tenantService.verifySubscriptionPayment(ref);
          }
          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ["tenant"] });
          queryClient.invalidateQueries({ queryKey: ["subscription"] });

          toast.success("สมัครแพ็กเกจสำเร็จ!", {
            description: "สถานะการใช้งานของคุณได้รับการอัพเดตแล้ว",
          });
        } catch (error) {
          console.error("Verification failed:", error);
          toast.warning("ชำระเงินสำเร็จ", {
            description: "ระบบกำลังตรวจสอบยอดเงิน สถานะจะอัพเดตในไม่ช้า",
          });
        }
      };

      verifyPayment();
    } else if (canceled === "true") {
      toast.error("ยกเลิกการชำระเงิน");
    }
  }, [searchParams, queryClient]);

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(bankForm);
  };

  const handleConnectLine = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    window.open(
      `${apiUrl}/line/connect?subdomain=${tenant?.subdomain}`,
      "_blank"
    );
  };

  const handleSelectPlan = (planId: string) => {
    createSubscription({
      plan: planId as "BASIC" | "PROFESSIONAL" | "ENTERPRISE",
    });
  };

  if (isLoading) {
    return <div className="animate-pulse">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ตั้งค่า</h1>
        <p className="text-muted-foreground">จัดการการตั้งค่าร้านของคุณ</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">ทั่วไป</TabsTrigger>
          <TabsTrigger value="subscription">แพ็กเกจ</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Current Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                แพ็กเกจปัจจุบัน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Badge className="text-lg px-4 py-1">{plan}</Badge>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      สถานะ:{" "}
                      <span
                        className={
                          status === "ACTIVE"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {status}
                      </span>
                    </p>
                    <p>
                      พนักงาน:{" "}
                      {limits.maxStaff === Infinity
                        ? "ไม่จำกัด"
                        : `สูงสุด ${limits.maxStaff} คน`}
                    </p>
                    <p>
                      บริการ:{" "}
                      {limits.maxServices === Infinity
                        ? "ไม่จำกัด"
                        : `สูงสุด ${limits.maxServices} รายการ`}
                    </p>
                    {limits.slipVerification && (
                      <p className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />{" "}
                        รองรับการตรวจสอบสลิป
                      </p>
                    )}
                    {limits.lineNotification && (
                      <p className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />{" "}
                        แจ้งเตือนผ่าน LINE
                      </p>
                    )}
                  </div>
                </div>
                {plan !== "ENTERPRISE" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      document
                        .querySelector('[value="subscription"]')
                        ?.dispatchEvent(new Event("click", { bubbles: true }))
                    }
                  >
                    อัพเกรด
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                บัญชีธนาคาร
              </CardTitle>
              <CardDescription>
                ตั้งค่าบัญชีสำหรับรับเงินจากลูกค้า
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>ธนาคาร</Label>
                    <Input
                      value={bankForm.bankName}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, bankName: e.target.value })
                      }
                      placeholder="กสิกรไทย"
                    />
                  </div>
                  <div>
                    <Label>เลขบัญชี</Label>
                    <Input
                      value={bankForm.bankAccountNo}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          bankAccountNo: e.target.value,
                        })
                      }
                      placeholder="123-4-56789-0"
                    />
                  </div>
                  <div>
                    <Label>ชื่อบัญชี</Label>
                    <Input
                      value={bankForm.bankAccountName}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          bankAccountName: e.target.value,
                        })
                      }
                      placeholder="ชื่อบัญชี"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* LINE Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                LINE Notification
              </CardTitle>
              <CardDescription>
                เชื่อมต่อ LINE เพื่อรับแจ้งเตือนเมื่อมีการชำระเงิน
                {!limits.lineNotification && (
                  <span className="ml-2 text-accent">
                    (ต้องใช้แพ็กเกจ Professional ขึ้นไป)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {tenant?.lineUserId ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        เชื่อมต่อแล้ว
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ID: {tenant.lineUserId.slice(0, 10)}...
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary">ยังไม่ได้เชื่อมต่อ</Badge>
                  )}
                </div>
                <Button
                  onClick={handleConnectLine}
                  variant={tenant?.lineUserId ? "outline" : "default"}
                  disabled={!limits.lineNotification}
                >
                  {tenant?.lineUserId ? "เชื่อมต่อใหม่" : "เชื่อมต่อ LINE"}
                </Button>
              </div>
              {!tenant?.lineUserId && limits.lineNotification && (
                <p className="text-sm text-muted-foreground mt-4">
                  หลังจากเพิ่มเพื่อน LINE OA แล้ว ให้พิมพ์{" "}
                  <code className="bg-muted px-1 rounded">
                    LINK:{tenant?.subdomain}
                  </code>{" "}
                  ในแชท
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">เลือกแพ็กเกจที่เหมาะกับคุณ</h2>
              <p className="text-muted-foreground">
                อัพเกรดเพื่อปลดล็อคฟีเจอร์เพิ่มเติม
              </p>
            </div>

            {isCreatingSubscription && (
              <Card className="border-primary">
                <CardContent className="flex items-center justify-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>กำลังเปลี่ยนเส้นทางไปยัง Stripe...</span>
                </CardContent>
              </Card>
            )}

            <SubscriptionPlans currentPlan={plan} onSelect={handleSelectPlan} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
