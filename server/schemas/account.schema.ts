import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

export const toggleAccountStatusSchema = z.object({
  params: z.object({
    staffId: objectIdSchema,
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const sendResetLinkSchema = z.object({
  params: z.object({
    staffId: objectIdSchema,
  }),
});
