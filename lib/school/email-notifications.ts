/**
 * Every notification appears in the portal. These kinds are also emailed,
 * because a family or teacher needs to know even if they don't log in.
 * Change this list to change what is emailed.
 */
export const EMAILED_TYPES: Record<string, string> = {
  result_published: "Results and report cards",
  fee_reminder: "Fee reminders",
  payment_confirmation: "Payment receipts",
  appointment: "Parent-teacher meetings",
  certificate_issued: "Certificates",
  library_overdue: "Overdue library books",
  parent_insight: "Weekly progress summaries",
  store_order: "School shop orders",
};

export const isEmailed = (type: string) => type in EMAILED_TYPES;
