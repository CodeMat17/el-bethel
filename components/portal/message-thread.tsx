"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { markThreadRead, sendMessage, type SimpleState } from "@/lib/school/actions/portal";
import { avatarTone, formatDateTime, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

const INITIAL: SimpleState = { ok: false };

export interface ThreadMessageView {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  sentAt: string;
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 shrink-0 font-bold" disabled={pending}>
      {pending ? <Spinner /> : <SendIcon />}
      <span className="hidden sm:inline">{pending ? "Sending…" : "Send"}</span>
    </Button>
  );
}

export function MessageThreadView({
  threadId,
  currentUserId,
  messages,
}: {
  threadId: string;
  currentUserId: string;
  messages: ThreadMessageView[];
}) {
  const [state, action] = useActionState<SimpleState, FormData>(sendMessage, INITIAL);
  const formRef = React.useRef<HTMLFormElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  // Opening a conversation marks it as read.
  React.useEffect(() => {
    const form = new FormData();
    form.set("threadId", threadId);
    void markThreadRead(form);
  }, [threadId]);

  React.useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="flex min-h-[26rem] flex-col">
      <ol className="flex-1 space-y-5 overflow-y-auto pr-1">
        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <li key={message.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className={cn("text-[0.7rem] font-bold", avatarTone(message.senderName))}>
                  {initials(...message.senderName.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
                </AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[80%] min-w-0", mine && "text-right")}>
                <p className="text-xs font-bold">{mine ? "You" : message.senderName}</p>
                <div
                  className={cn(
                    "mt-1.5 inline-block rounded-2xl px-4 py-3 text-left text-sm leading-relaxed",
                    mine
                      ? "rounded-tr-sm bg-navy text-navy-foreground"
                      : "rounded-tl-sm border bg-card",
                  )}
                >
                  {message.body}
                </div>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">{formatDateTime(message.sentAt)}</p>
              </div>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>

      <form ref={formRef} action={action} className="mt-6 flex items-end gap-2 border-t pt-4">
        <input type="hidden" name="threadId" value={threadId} />
        <label htmlFor="message-body" className="sr-only">
          Your message
        </label>
        <Textarea
          id="message-body"
          name="body"
          rows={2}
          required
          maxLength={4000}
          placeholder="Write a reply…"
          className="min-h-11 flex-1 resize-none"
        />
        <SendButton />
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Messages are kept on the child&apos;s record and are visible to the school&apos;s safeguarding lead.
      </p>
    </div>
  );
}
