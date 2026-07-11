import { AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function DisclaimerBanner() {
  return (
    <div className="rounded-2xl border border-sheen glass p-4 text-sm shadow-soft">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="text-muted-foreground">
          <strong className="text-foreground">Estimates only.</strong> Numbers, rates, and rules change frequently.
          Verify all figures directly with your bank, broker, or the relevant authority before making any financial decision.{" "}
          <Link to="/disclaimer" className="text-primary underline underline-offset-4">Full disclaimer</Link>.
        </div>
      </div>
    </div>
  );
}
