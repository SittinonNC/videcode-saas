"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import { Calendar, Users, Scissors, DollarSign } from "lucide-react";

const stats = [
  {
    title: "การจองวันนี้",
    value: "8",
    icon: Calendar,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "ลูกค้าทั้งหมด",
    value: "124",
    icon: Users,
    color: "text-green-600 bg-green-50",
  },
  {
    title: "บริการ",
    value: "12",
    icon: Scissors,
    color: "text-purple-600 bg-purple-50",
  },
  {
    title: "รายได้เดือนนี้",
    value: "฿45,230",
    icon: DollarSign,
    color: "text-pink-600 bg-pink-50",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">สวัสดี, {user?.firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          ยินดีต้อนรับเข้าสู่ระบบจัดการร้าน
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>การจองที่กำลังจะมาถึง</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">ยังไม่มีการจองวันนี้</p>
        </CardContent>
      </Card>
    </div>
  );
}
