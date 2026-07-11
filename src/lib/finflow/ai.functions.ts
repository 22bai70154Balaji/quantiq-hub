import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callGroq } from "./groq.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

const SYSTEM_PROMPT = `You are Calculyx AI, a friendly, precise financial assistant for users in India, USA, and UAE.
You explain calculations step-by-step, compare loan and investment options, and give context-aware advice.
Always: use the user's local currency when known, cite formulas simply, mention tax rules by jurisdiction,
be numerate but plain-spoken, and refuse to give personalized legal/tax advice — recommend a licensed advisor for that.
Format with short paragraphs, bold key numbers, and use tables when comparing options.`;

export const askFinFlowAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      messages: z.array(MessageSchema).min(1).max(50),
      country: z.enum(["IN", "US", "AE"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const contextMsg = data.country
      ? `User country: ${data.country === "IN" ? "India (INR)" : data.country === "US" ? "USA (USD)" : "UAE (AED)"}. Default calculations and examples to this jurisdiction unless asked otherwise.`
      : "";

    const reply = await callGroq(
      [
        { role: "system", content: SYSTEM_PROMPT + (contextMsg ? "\n\n" + contextMsg : "") },
        ...data.messages,
      ],
      { temperature: 0.6 },
    );
    return { reply };
  });
