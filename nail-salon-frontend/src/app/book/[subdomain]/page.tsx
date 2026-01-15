"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  usePublicServices,
  usePublicStaff,
  usePublicBooking,
} from "@/hooks/use-public";
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
import { toast } from "sonner";

export default function PublicBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const { data: services, isLoading: loadingServices } =
    usePublicServices(subdomain);
  const { data: staffList, isLoading: loadingStaff } =
    usePublicStaff(subdomain);
  const { mutate: createBooking, isPending } = usePublicBooking(subdomain);

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [bookingResult, setBookingResult] = useState<{
    bookingNumber: string;
    totalAmount: number;
    paymentUrl: string;
  } | null>(null);

  const selectedServiceData =
    services?.filter((s) => selectedServices.includes(s.id)) || [];
  const totalAmount = selectedServiceData.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServiceData.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  );

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  const handleSubmit = async () => {
    const startDateTime = `${selectedDate}T${selectedTime}:00`;

    createBooking(
      {
        customerFirstName: customerInfo.firstName,
        customerLastName: customerInfo.lastName,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email || undefined,
        staffId: selectedStaff,
        startTime: startDateTime,
        services: selectedServices.map((id) => ({
          serviceId: id,
        })),
      },
      {
        onSuccess: (data) => {
          setBookingResult({
            bookingNumber: data.bookingNumber,
            totalAmount: data.totalAmount,
            paymentUrl: data.paymentUrl,
          });
          setStep(4);
        },
        onError: (error) => {
          toast.error("ไม่สามารถจองได้", {
            description: error.message || "กรุณาลองใหม่อีกครั้ง",
          });
        },
      }
    );
  };

  if (loadingServices || loadingStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0FFDF] to-[#FFD8DF]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FFDF] to-[#FFD8DF] p-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">💅 {subdomain}</h1>
          <p className="text-muted-foreground">จองบริการออนไลน์</p>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Select Services */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                เลือกบริการ
              </CardTitle>
              <CardDescription>เลือกบริการที่ต้องการ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {services?.map((service) => (
                <div
                  key={service.id}
                  onClick={() => {
                    if (selectedServices.includes(service.id)) {
                      setSelectedServices(
                        selectedServices.filter((id) => id !== service.id)
                      );
                    } else {
                      setSelectedServices([...selectedServices, service.id]);
                    }
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedServices.includes(service.id)
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.durationMinutes} นาที
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      ฿{service.price.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              ))}

              {selectedServices.length > 0 && (
                <div className="pt-4 border-t space-y-1">
                  <div className="flex justify-between">
                    <span>รวมเวลา</span>
                    <span>{totalDuration} นาที</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>รวมราคา</span>
                    <span className="text-primary">
                      ฿{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                disabled={selectedServices.length === 0}
                onClick={() => setStep(2)}
              >
                ถัดไป
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Staff & Time */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                เลือกวันเวลา
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>เลือกช่าง</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {staffList?.map((staff) => (
                    <div
                      key={staff.id}
                      onClick={() => setSelectedStaff(staff.id)}
                      className={`p-3 border rounded-lg cursor-pointer text-center ${
                        selectedStaff === staff.id
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <User className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-sm font-medium">{staff.firstName}</p>
                      {staff.nickname && (
                        <p className="text-xs text-muted-foreground">
                          {staff.nickname}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>วันที่</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <Label>เวลา</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  ย้อนกลับ
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedStaff || !selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                >
                  ถัดไป
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Customer Info */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ข้อมูลติดต่อ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ชื่อ</Label>
                  <Input
                    value={customerInfo.firstName}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        firstName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>นามสกุล</Label>
                  <Input
                    value={customerInfo.lastName}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        lastName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label>โทรศัพท์</Label>
                <Input
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  placeholder="0812345678"
                  required
                />
              </div>
              <div>
                <Label>อีเมล (ไม่บังคับ)</Label>
                <Input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">วันที่</span>
                  <span>
                    {selectedDate} เวลา {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">บริการ</span>
                  <span>
                    {selectedServiceData.map((s) => s.name).join(", ")}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>รวมทั้งหมด</span>
                  <span className="text-primary">
                    ฿{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  ย้อนกลับ
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    !customerInfo.firstName ||
                    !customerInfo.lastName ||
                    !customerInfo.phone ||
                    isPending
                  }
                  onClick={handleSubmit}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังจอง...
                    </>
                  ) : (
                    "ยืนยันการจอง"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && bookingResult && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-600">จองสำเร็จ!</h2>
              <p className="text-muted-foreground">
                กรุณาชำระเงินเพื่อยืนยันการจอง
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">หมายเลขการจอง</p>
                <p className="font-mono font-bold text-lg">
                  {bookingResult.bookingNumber}
                </p>
                <p className="text-2xl font-bold text-primary mt-2">
                  ฿{bookingResult.totalAmount.toLocaleString()}
                </p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() =>
                  router.push(`/pay/${bookingResult.bookingNumber}`)
                }
              >
                ชำระเงิน
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
