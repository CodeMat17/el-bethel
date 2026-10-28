"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { MAX_IMAGE, uploadWithProgress } from "@/components/media-upload";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { requestUploadTicket } from "@/lib/school/actions/media";
import { setMyPhoto } from "@/lib/school/actions/portal";
import { avatarTone, fileSize } from "@/lib/school/format";
import { cn } from "@/lib/utils";

/**
 * A large profile portrait: the uploaded photo, or the person's initials on
 * their colour. With `editable`, the signed-in teacher or parent can upload,
 * replace or remove their own photo.
 */
export function ProfilePhoto({
  url,
  seed,
  initials,
  editable,
  className,
}: {
  url?: string;
  seed: string;
  initials: string;
  editable?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const busy = progress !== null || saving;

  async function save(photo?: Parameters<typeof setMyPhoto>[0]) {
    setSaving(true);
    try {
      const result = await setMyPhoto(photo);
      if (!result.ok) return toast.error(result.message ?? "Couldn't save your photo.");
      toast.success(result.message);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose a photo (JPG, PNG or WEBP).");
    if (file.size > MAX_IMAGE) return toast.error(`Photos must be under ${fileSize(MAX_IMAGE)}.`);
    setProgress(0);
    try {
      const ticket = await requestUploadTicket("people");
      if (!ticket.ok) throw new Error(ticket.message);
      const photo = await uploadWithProgress(file, ticket, setProgress);
      setProgress(null);
      await save(photo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-3">
      <div
        className={cn(
          "relative size-36 overflow-hidden rounded-2xl ring-4 ring-gold/40 sm:size-44",
          !url && avatarTone(seed),
          className,
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary portrait
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center font-heading text-4xl font-extrabold sm:text-5xl">{initials}</span>
        )}
        {busy ? (
          <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-bold text-white">
            <span className="flex items-center gap-2">
              <Spinner />
              {progress !== null ? `${progress}%` : "Saving…"}
            </span>
          </span>
        ) : null}
      </div>

      {editable ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          <Button type="button" size="sm" variant="secondary" className="font-bold" disabled={busy} onClick={() => inputRef.current?.click()}>
            <CameraIcon />
            {url ? "Change photo" : "Add photo"}
          </Button>
          {url ? (
            <Button type="button" size="icon-sm" variant="secondary" aria-label="Remove photo" disabled={busy} onClick={() => void save(undefined)}>
              <Trash2Icon />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
