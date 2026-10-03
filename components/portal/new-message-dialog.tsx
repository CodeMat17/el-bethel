"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PenSquareIcon, SendIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { startConversation } from "@/lib/school/actions/portal";

export interface Contact {
  userId: string;
  name: string;
  label: string;
  studentId?: string;
}

export function NewMessageDialog({ contacts, basePath }: { contacts: Contact[]; basePath: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [to, setTo] = React.useState(contacts[0]?.userId ?? "");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const contact = contacts.find((c) => c.userId === to);

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!to) return setError("Choose who to message.");
    if (!subject.trim()) return setError("Add a subject.");
    if (!body.trim()) return setError("Write your message.");
    const form = new FormData();
    form.set("toUserId", to);
    form.set("subject", subject);
    form.set("body", body);
    if (contact?.studentId) form.set("studentId", contact.studentId);
    startTransition(async () => {
      const res = await startConversation({ ok: false }, form);
      if (!res.ok) {
        setError(res.message ?? "Your message was not sent.");
        return;
      }
      toast.success("Message sent");
      setOpen(false);
      setSubject("");
      setBody("");
      router.push(res.threadId ? `${basePath}/${res.threadId}` : basePath);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button size="lg" className="font-bold" />}>
        <PenSquareIcon />
        New message
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Messages are kept on the school record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={send} className="space-y-4">
          {error ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          ) : null}
          <Field>
            <FieldLabel htmlFor="nm-to">To</FieldLabel>
            <Select
              value={to}
              items={contacts.map((c) => ({ value: c.userId, label: `${c.name} — ${c.label}` }))}
              onValueChange={(v) => setTo(String(v))}
              disabled={pending}
            >
              <SelectTrigger id="nm-to" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.userId} value={c.userId}>
                    {c.name} — {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="nm-subject">Subject</FieldLabel>
            <Input id="nm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} className="h-11" disabled={pending} />
          </Field>
          <Field>
            <FieldLabel htmlFor="nm-body">Message</FieldLabel>
            <Textarea id="nm-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} disabled={pending} />
          </Field>
          <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
            {pending ? <Spinner /> : <SendIcon />}
            {pending ? "Sending…" : "Send message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
