"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Clock, Image } from "lucide-react";
import {
  useServices,
  useCreateService,
  useDeleteService,
} from "@/hooks/use-services";
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

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const { mutate: createService, isPending } = useCreateService();
  const { mutate: deleteService } = useDeleteService();
  const { canAddService, limits } = useSubscription();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    durationMinutes: 60,
    price: 0,
    imageUrl: "",
  });

  const serviceCount = services?.length || 0;
  const canAdd = canAddService(serviceCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createService(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: "",
          description: "",
          category: "",
          durationMinutes: 60,
          price: 0,
          imageUrl: "",
        });
      },
    });
  };

  if (isLoading) {
    return <div className="animate-pulse">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">บริการ</h1>
            <PlanBadge />
          </div>
          <p className="text-muted-foreground">
            จัดการบริการที่ร้านให้บริการ ({serviceCount}/
            {limits.maxServices === Infinity ? "∞" : limits.maxServices})
          </p>
        </div>

        {canAdd ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มบริการ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มบริการใหม่</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>ชื่อบริการ</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Gel Manicure"
                    required
                  />
                </div>
                <div>
                  <Label>รายละเอียด</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Professional gel manicure with long-lasting finish"
                  />
                </div>
                <div>
                  <Label>หมวดหมู่</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Manicure"
                    required
                  />
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label>ระยะเวลา (นาที)</Label>
                    <Input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMinutes: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>ราคา (บาท)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>URL รูปภาพ</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
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
            เพิ่มบริการ
          </Button>
        )}
      </div>

      {/* Limit Warning */}
      {!canAdd && (
        <LimitGate type="service" currentCount={serviceCount}>
          <></>
        </LimitGate>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services && services.length > 0 ? (
          services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              {service.imageUrl && (
                <div className="h-32 bg-muted overflow-hidden">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!service.imageUrl && (
                <div className="h-32 bg-muted flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  </div>
                  <Badge variant={service.isActive ? "default" : "secondary"}>
                    {service.isActive ? "เปิด" : "ปิด"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">{service.category}</Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {service.durationMinutes} นาที
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ฿{service.price.toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              ยังไม่มีบริการ
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
