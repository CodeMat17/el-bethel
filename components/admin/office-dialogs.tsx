"use client";

import * as React from "react";
import { BanknoteIcon, PencilIcon } from "lucide-react";

import { Hidden, SelectField, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { recordPayment, updateBankDetails, updateEnquiry } from "@/lib/school/actions/admin";
import { money } from "@/lib/school/format";
import type { Enquiry } from "@/lib/school/types";

export function EnquiryDialog({ enquiry }: { enquiry: Enquiry }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" className="font-bold">
          <PencilIcon />
          Update
        </Button>
      }
      title={`Enquiry from ${enquiry.name}`}
      description="Record the status and a note of how it was answered. Reply to the family by email or phone."
      action={updateEnquiry}
    >
      <Hidden name="id" value={enquiry.id} />
      <SelectField
        name="status"
        label="Status"
        options={[
          { value: "new", label: "New" },
          { value: "assigned", label: "Assigned" },
          { value: "in_progress", label: "In progress" },
          { value: "resolved", label: "Resolved" },
          { value: "archived", label: "Archived" },
        ]}
        defaultValue={enquiry.status}
      />
      <TextareaField name="reply" label="Reply / note" rows={4} defaultValue={enquiry.reply} />
    </FormDialog>
  );
}

export function BankDetailsDialog({ bank }: { bank: { bankName: string; accountNumber: string; accountName: string } }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" className="font-bold">
          <PencilIcon />
          Edit
        </Button>
      }
      title="School bank account"
      description="Shown to families on the application form and fee pages for bank transfers."
      action={updateBankDetails}
      submitLabel="Save bank details"
      pendingLabel="Saving…"
    >
      <TextField name="bankName" label="Bank" defaultValue={bank.bankName} required />
      <TextField name="accountNumber" label="Account number" inputMode="numeric" pattern="\d{10}" maxLength={10} defaultValue={bank.accountNumber} required />
      <TextField name="accountName" label="Account name" defaultValue={bank.accountName} required />
    </FormDialog>
  );
}

export function RecordPaymentDialog({ invoiceId, invoiceNo, balance, studentName }: { invoiceId: string; invoiceNo: string; balance: number; studentName: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" className="font-bold">
          <BanknoteIcon />
          Record payment
        </Button>
      }
      title={`Record a payment · ${invoiceNo}`}
      description={`${studentName} · balance ${money(balance)}. Only record money the school has actually received.`}
      action={recordPayment}
      submitLabel="Record payment"
      pendingLabel="Recording…"
    >
      <Hidden name="invoiceId" value={invoiceId} />
      <TextField name="amount" type="number" min={1} max={balance} label="Amount (₦)" defaultValue={balance} required />
      <SelectField
        name="provider"
        label="Method"
        options={[
          { value: "bank_transfer", label: "Bank transfer" },
          { value: "cash", label: "Cash / POS at the bursary" },
        ]}
        defaultValue="bank_transfer"
      />
      <TextField name="reference" label="Bank or teller reference (optional)" />
    </FormDialog>
  );
}
