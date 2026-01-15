import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อร้าน"),
  subdomain: z
    .string()
    .min(3, "Subdomain ต้องมีอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-z0-9-]+$/, "Subdomain ใช้ได้เฉพาะ a-z, 0-9 และ -"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  phone: z.string().optional(),
  ownerEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  ownerPassword: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  ownerFirstName: z.string().min(1, "กรุณากรอกชื่อ"),
  ownerLastName: z.string().min(1, "กรุณากรอกนามสกุล"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
