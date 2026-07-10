import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGroq } from "./groq.server";

const InputSchema = z.object({
  country: z.enum(["IN", "US", "AE"]),
  currency: z.string(),
  propertyPrice: z.number(),
  downPayment: z.number(),
  loanAmount: z.number(),
  interestRate: z.number(),
  tenureYears: z.number(),
  emi: z.number(),
  totalInterest: z.number(),
  dti: z.number(),
  ltv: z.number(),
  affordabilityScore: z.number(),
  creditScore: z.number(),
  monthlyIncome: z.number(),
  monthlyBudgetRemaining: z.number(),
  bestBank: z.object({ name: z.string(), rate: z.number(), emi: z.number() }).optional(),
});

export const analyzeHomeLoan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const prompt = `You are a senior mortgage advisor. Analyze this home loan scenario and give a concise, actionable review.

Country: ${data.country}
Currency: ${data.currency}
Property price: ${data.propertyPrice}
Down payment: ${data.downPayment} (${((data.downPayment / data.propertyPrice) * 100).toFixed(1)}%)
Loan amount: ${data.loanAmount}
LTV: ${data.ltv.toFixed(1)}%
Interest rate: ${data.interestRate}%
Tenure: ${data.tenureYears} years
Monthly EMI: ${data.emi.toFixed(0)}
Total interest: ${data.totalInterest.toFixed(0)}
DTI: ${data.dti.toFixed(1)}%
Monthly income: ${data.monthlyIncome}
Monthly budget remaining after EMI: ${data.monthlyBudgetRemaining.toFixed(0)}
Credit score: ${data.creditScore}
Affordability score: ${data.affordabilityScore}/100
${data.bestBank ? `Cheapest bank match: ${data.bestBank.name} @ ${data.bestBank.rate}% (EMI ${data.bestBank.emi.toFixed(0)})` : ""}

Respond in markdown with these sections (short, punchy, no fluff):
### Verdict
One line: can they comfortably afford this? (Green/Yellow/Red).

### Key strengths
- 2-3 bullets.

### Risks & red flags
- 2-3 bullets.

### Recommendations
- 3-5 specific actions (bump down payment, shorten tenure, switch bank, prepay X% monthly to save Y, etc.). Cite numbers.

### Bottom line
1-2 sentences.`;

    const reply = await callGroq(
      [
        { role: "system", content: "You are a precise, no-nonsense mortgage advisor. Use the user's currency and be numerate." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.5 },
    );
    return { analysis: reply };
  });
