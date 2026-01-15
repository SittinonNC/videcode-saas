"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Phone, Mail, User2 } from "lucide-react";
import { useStaff, useCreateStaff, useDeleteStaff } from "@/hooks/use-staff";
import { useSubscription } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LimitGate, PlanBadge } from "@/components/features/feature-gate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StaffPage() {
  const router = useRouter();
  const { data: staff, isLoading } = useStaff();
  const { mutate: createStaff, isPending } = useCreateStaff();
  const { mutate: deleteStaff } = useDeleteStaff();
  const { canAddStaff, limits, plan } = useSubscription();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    phone: "",
    specialties: "",
  });

  const staffCount = staff?.length || 0;
  const canAdd = canAddStaff(staffCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStaff(
      {
        ...formData,
        specialties: formData.specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFormData({
            firstName: "",
            lastName: "",
            nickname: "",
            email: "",
            phone: "",
            specialties: "",
          });
        },
      }
    );
  };

  if (isLoading) {
    return <div className="animate-pulse">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">พนักงาน</h1>
            <PlanBadge />
          </div>
          <p className="text-muted-foreground">
            จัดการข้อมูลพนักงานในร้าน ({staffCount}/
            {limits.maxStaff === Infinity ? "∞" : limits.maxStaff})
          </p>
        </div>

        {canAdd ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มพนักงาน
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label>ชื่อ</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>นามสกุล</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>ชื่อเล่น</Label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
                    }
                    placeholder="เช่น นุ่น"
                  />
                </div>
                <div>
                  <Label>อีเมล</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>โทรศัพท์</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>ความชำนาญ (คั่นด้วย ,)</Label>
                  <Input
                    value={formData.specialties}
                    onChange={(e) =>
                      setFormData({ ...formData, specialties: e.target.value })
                    }
                    placeholder="Manicure, Pedicure, Nail Art"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มพนักงาน
          </Button>
        )}
      </div>

      {/* Limit Warning */}
      {!canAdd && (
        <LimitGate type="staff" currentCount={staffCount}>
          <></>
        </LimitGate>
      )}

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพนักงาน ({staffCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {staff && staff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>ติดต่อ</TableHead>
                  <TableHead>ความชำนาญ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {person.avatarUrl ? (
                            <img
                              src={person.avatarUrl}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {person.firstName} {person.lastName}
                          </p>
                          {person.nickname && (
                            <p className="text-sm text-muted-foreground">
                              "{person.nickname}"
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {person.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {person.email}
                          </span>
                        )}
                        {person.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {person.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {person.specialties?.map((specialty, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={person.isActive ? "default" : "secondary"}
                      >
                        {person.isActive ? "ทำงาน" : "หยุด"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteStaff(person.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              ยังไม่มีพนักงาน
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
