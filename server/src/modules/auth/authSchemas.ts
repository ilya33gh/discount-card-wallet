import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(6).max(72)
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
