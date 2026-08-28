"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CreditCardIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { payInvoice, type PaymentState } from "@/lib/school/actions/payments";
import { money } from "@/lib/school/format";

const INITIAL: PaymentState = { ok: false };

function SubmitButton({ amount }: { amount: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
      {pending ? <Spinner /> : <CreditCardIcon />}
      {pending ? "Processing…" : `Pay ${money(amount)}`}
    </Button>
  );
}

export function PayInvoiceDialog({
  invoiceId,
  invoiceNo,
  balance,
  studentName,
}: {
  invoiceId: string;
  invoiceNo: string;
  balance: number;
  studentName: string;
}) {
  const [state, action] = useActionState<PaymentState, FormData>(payInvoice, INITIAL);
  const [requestedOpen, setRequestedOpen] = React.useState(false);
  // Derived, not synchronised: a successful action closes the dialog without an effect.
  const open = requestedOpen && !state.ok;
  const [amount, setAmount] = React.useState(balance);

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Payment successful", { description: state.message });
    } else if (!state.ok && state.message) {
      toast.error("Payment not completed", { description: state.message });
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setRequestedOpen}>
      <DialogTrigger render={<Button size="lg" className="w-full font-bold" />}>
        <CreditCardIcon />
        Pay {money(balance)}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay school fees</DialogTitle>
          <DialogDescription>
            {invoiceNo} · {studentName} · outstanding balance {money(balance)}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <input type="hidden" name="invoiceId" value={invoiceId} />

          {state.message && !state.ok ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            >
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              {state.message}
            </div>
          ) : null}

          <Field>
            <FieldLabel htmlFor="amount">Amount to pay</FieldLabel>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={1000}
              max={balance}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-11"
              required
            />
            <FieldDescription>
              Pay the full balance or a part payment of at least ₦1,000.
            </FieldDescription>
            <div className="mt-2 flex gap-2">
              <Button type="button" variant="outline" size="sm" className="font-bold" onClick={() => setAmount(balance)}>
                Full balance
              </Button>
              <Button type="button" variant="outline" size="sm" className="font-bold" onClick={() => setAmount(Math.round(balance / 2))}>
                Half
              </Button>
            </div>
          </Field>

          <fieldset>
            <legend className="text-sm font-extrabold">Payment method</legend>
            <RadioGroup name="provider" defaultValue="paystack" className="mt-3 grid gap-2">
              {[
                { value: "paystack", label: "Paystack", detail: "Card, transfer or USSD" },
                { value: "flutterwave", label: "Flutterwave", detail: "Card, transfer or mobile money" },
                { value: "bank_transfer", label: "Bank transfer", detail: "Pay to the school account" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3.5 transition-colors has-data-checked:border-gold has-data-checked:bg-gold/8"
                >
                  <RadioGroupItem value={option.value} />
                  <span>
                    <span className="block text-sm font-extrabold">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.detail}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <p className="rounded-xl bg-muted/70 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">Demo environment.</span> No real payment is taken.
            In production the transaction is verified server-side with the provider before an invoice is
            updated.
          </p>

          <SubmitButton amount={amount} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
