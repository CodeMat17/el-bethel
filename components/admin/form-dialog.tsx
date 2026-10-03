"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SaveIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { MediaUpload } from "@/components/media-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { MediaPurpose } from "@/lib/school/cloudinary";
import type { CloudMedia } from "@/lib/school/types";

export interface DialogResult {
  ok: boolean;
  message?: string;
  id?: string;
}

/**
 * A dialog wrapping an uncontrolled form. On submit it calls the server action
 * with the form data (plus an uploaded photo/video, when `media` is enabled),
 * shows a spinner while it runs, and refreshes the page on success.
 */
export function FormDialog({
  trigger,
  title,
  description,
  action,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  media,
  wide,
  onSuccess,
}: {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  action: (formData: FormData, media?: CloudMedia) => Promise<DialogResult>;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  media?: { purpose: MediaPurpose; accept?: "image" | "video" | "both"; initial?: CloudMedia; required?: boolean; label?: string };
  wide?: boolean;
  onSuccess?: (result: DialogResult) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [file, setFile] = React.useState<CloudMedia | undefined>(media?.initial);
  const [uploading, setUploading] = React.useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (media?.required && !file) {
      setError(media.accept === "video" ? "Upload a video first." : media.accept === "both" ? "Upload a photo or video first." : "Upload a photo first.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    // Send date-times as ISO strings so the server doesn't reinterpret them in its own time zone.
    event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]').forEach((input) => {
      if (input.name && input.value) formData.set(input.name, new Date(input.value).toISOString());
    });
    startTransition(async () => {
      const result = await action(formData, file);
      if (!result.ok) {
        setError(result.message ?? "That didn't save. Please try again.");
        return;
      }
      toast.success(result.message ?? "Saved");
      setOpen(false);
      if (!media?.initial) setFile(undefined);
      onSuccess?.(result);
      router.refresh();
    });
  }

  const busy = pending || uploading;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (next) {
          setError(null);
          setFile(media?.initial);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className={wide ? "max-h-[92dvh] overflow-y-auto sm:max-w-2xl" : "max-h-[92dvh] overflow-y-auto sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {media ? (
            <Field>
              <FieldLabel>{media.label ?? (media.accept === "video" ? "Video" : media.accept === "both" ? "Photo or video" : "Photo")}</FieldLabel>
              <MediaUpload purpose={media.purpose} accept={media.accept ?? "image"} value={file} onChange={setFile} onBusyChange={setUploading} disabled={pending} />
            </Field>
          ) : null}

          <fieldset disabled={pending} className="space-y-4">
            {children}
          </fieldset>

          <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={busy}>
            {pending ? <Spinner /> : <SaveIcon />}
            {pending ? pendingLabel : uploading ? "Waiting for upload…" : submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
