"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useBankInfo, useVerifySlip } from "@/hooks/use-payments";
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

export default function PaymentPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const { data: bankInfo, isLoading, error } = useBankInfo(bookingId);
  const { mutate: verifySlip, isPending, data: result } = useVerifySlip();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleSubmit = () => {
    if (selectedFile) {
      verifySlip({ bookingId, slipImage: selectedFile });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error || !bankInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">ไม่พบข้อมูลการจอง</h2>
            <p className="text-muted-foreground mt-2">
              กรุณาตรวจสอบลิงก์ใหม่อีกครั้ง
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600">
              ชำระเงินสำเร็จ!
            </h2>
            <p className="text-muted-foreground mt-2">
              ขอบคุณที่ใช้บริการ ทางร้านจะติดต่อกลับเร็วๆ นี้
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">หมายเลขการจอง</p>
              <p className="font-mono font-bold">{bankInfo.bookingNumber}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 py-8">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">💅 ชำระเงิน</h1>
          <p className="text-muted-foreground">
            หมายเลข: {bankInfo.bookingNumber}
          </p>
        </div>

        {/* Bank Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลบัญชีธนาคาร</CardTitle>
            <CardDescription>กรุณาโอนเงินไปยังบัญชีด้านล่าง</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-pink-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-pink-600">
                ฿{bankInfo.amount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ธนาคาร</span>
                <span className="font-medium">{bankInfo.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">เลขบัญชี</span>
                <span className="font-mono font-medium">
                  {bankInfo.bankAccountNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ชื่อบัญชี</span>
                <span className="font-medium">{bankInfo.bankAccountName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slip Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>อัปโหลดสลิป</CardTitle>
            <CardDescription>
              หลังโอนเงินแล้ว กรุณาอัปโหลดสลิปเพื่อยืนยันการชำระเงิน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slip">เลือกรูปสลิป</Label>
              <Input
                id="slip"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>

            {preview && (
              <div className="relative">
                <img
                  src={preview}
                  alt="Slip preview"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            {result && !result.success && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{result.error}</p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedFile || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  ยืนยันการชำระเงิน
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
