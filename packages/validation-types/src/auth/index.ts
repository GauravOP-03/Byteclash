import * as z from "zod";

export const signupBody = z
  .object({
    email: z.email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "password must be 8 character")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export type signupBodyType = z.infer<typeof signupBody>;

const purpose_option = [
  "signup",
  "reset_password",
  "login",
  "verify_email",
] as const;

export const verifyOtpSchema = z.object({
  otp: z.string().min(6).max(6),
  purpose: z.enum(purpose_option),
  email: z.email("Please enter a valid email"),
});

export type verifyOtpType = z.infer<typeof verifyOtpSchema>;

export const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "password must be 8 character")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export type loginSchemaType = z.infer<typeof loginSchema>;
