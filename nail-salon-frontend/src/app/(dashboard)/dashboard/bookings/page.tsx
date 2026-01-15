"use client";

import { useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  useBookings,
  useUpdateBookingStatus,
  useCancelBooking,
  useCreateBooking,
} from "@/hooks/use-bookings";
import { useStaff } from "@/hooks/use-staff";
import { useServices } from "@/hooks/use-services";
import { useCustomers } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "รอยืนยัน", variant: "secondary" },
  CONFIRMED: { label: "ยืนยันแล้ว", variant: "default" },
  COMPLETED: { label: "เสร็จสิ้น", variant: "outline" },
  CANCELLED: { label: "ยกเลิก", variant: "destructive" },
  NO_SHOW: { label: "ไม่มา", variant: "destructive" },
};

export default function BookingsPage() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "ALL",
  });

  const { data: bookings, isLoading } = useBookings({
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    status: filters.status === "ALL" ? undefined : filters.status,
  });

  const { data: staffList } = useStaff();
  const { data: serviceList } = useServices();
  const { data: customerList } = useCustomers();
  const { mutate: updateStatus } = useUpdateBookingStatus();
  const { mutate: cancelBooking } = useCancelBooking();
  const { mutate: createBooking, isPending: isCreating } = useCreateBooking();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    staffId: "",
    serviceIds: [] as string[],
    startTime: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBooking(
      {
        customerId: formData.customerId,
        staffId: formData.staffId,
        startTime: new Date(formData.startTime).toISOString(),
        services: formData.serviceIds.map((id) => ({
          serviceId: id,
        })),
        notes: formData.notes || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFormData({
            customerId: "",
            staffId: "",
            serviceIds: [],
            startTime: "",
            notes: "",
          });
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <div className="animate-pulse">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">การจอง</h1>
          <p className="text-muted-foreground">
            จัดการการจองของลูกค้า ({bookings?.length || 0} รายการ)
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="w-[160px]"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="w-[160px]"
          />
          <Select
            value={filters.status}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, status: v }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทั้งหมด</SelectItem>
              <SelectItem value="PENDING">รอยืนยัน</SelectItem>
              <SelectItem value="CONFIRMED">ยืนยันแล้ว</SelectItem>
              <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
              <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              <SelectItem value="NO_SHOW">ไม่มา</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              สร้างการจอง
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>สร้างการจองใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>ลูกค้า</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, customerId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกลูกค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerList?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>พนักงาน</Label>
                <Select
                  value={formData.staffId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, staffId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกพนักงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}{" "}
                        {s.nickname && `(${s.nickname})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>บริการ</Label>
                <Select
                  value={formData.serviceIds[0] || ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, serviceIds: [v] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบริการ" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceList?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - ฿{s.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>วันเวลา</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>หมายเหตุ</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="ข้อมูลเพิ่มเติม"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "กำลังสร้าง..." : "สร้างการจอง"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการจอง</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หมายเลข</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>วันที่/เวลา</TableHead>
                  <TableHead>บริการ</TableHead>
                  <TableHead>ราคา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">
                      {booking.bookingNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {booking.customer?.firstName}{" "}
                            {booking.customer?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.customer?.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(booking.startTime)}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(booking.startTime)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {booking.services?.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s.service?.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      ฿{booking.totalAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusMap[booking.status]?.variant || "secondary"
                        }
                      >
                        {statusMap[booking.status]?.label || booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {booking.status === "PENDING" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus({
                                  id: booking.id,
                                  status: "CONFIRMED",
                                })
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              ยืนยัน
                            </DropdownMenuItem>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus({
                                  id: booking.id,
                                  status: "COMPLETED",
                                })
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              เสร็จสิ้น
                            </DropdownMenuItem>
                          )}
                          {(booking.status === "PENDING" ||
                            booking.status === "CONFIRMED") && (
                            <DropdownMenuItem
                              onClick={() => cancelBooking(booking.id)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              ยกเลิก
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              ยังไม่มีการจอง
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
