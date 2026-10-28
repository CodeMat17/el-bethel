"use client";

import * as React from "react";
import { FilmIcon, ImageIcon, TriangleAlertIcon, UploadIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { requestUploadTicket } from "@/lib/school/actions/media";
import type { MediaPurpose } from "@/lib/school/cloudinary";
import { fileSize } from "@/lib/school/format";
import type { CloudMedia } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 100 * 1024 * 1024;

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  resource_type: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: { message: string };
}

/** Upload a file straight to Cloudinary with a server-signed ticket, reporting progress. */
export function uploadWithProgress(
  file: File,
  ticket: { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string },
  onProgress: (pct: number) => void,
): Promise<CloudMedia> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", ticket.apiKey);
    form.append("timestamp", String(ticket.timestamp));
    form.append("folder", ticket.folder);
    form.append("signature", ticket.signature);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${ticket.cloudName}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as CloudinaryResponse;
        if (xhr.status >= 300 || data.error) return reject(new Error(data.error?.message ?? "Upload failed."));
        resolve({
          publicId: data.public_id,
          url: data.secure_url,
          resourceType: data.resource_type === "video" ? "video" : "image",
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes,
        });
      } catch {
        reject(new Error("Upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(form);
  });
}

export function MediaPreview({ media, className }: { media: CloudMedia; className?: string }) {
  return media.resourceType === "video" ? (
    <video src={media.url} controls preload="metadata" className={cn("w-full rounded-xl bg-black", className)} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary preview of arbitrary size
    <img src={media.url} alt="" className={cn("w-full rounded-xl object-cover", className)} />
  );
}

/**
 * Photo/video picker. Uploads immediately to Cloudinary and reports the stored
 * media through `onChange`; the form then saves the reference in Convex.
 */
export function MediaUpload({
  purpose,
  value,
  onChange,
  accept = "image",
  label,
  disabled,
  onBusyChange,
}: {
  purpose: MediaPurpose;
  value?: CloudMedia;
  onChange: (media: CloudMedia | undefined) => void;
  accept?: "image" | "video" | "both";
  label?: string;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const acceptAttr = accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  async function onFile(file: File) {
    setError(null);
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if ((accept === "image" && !isImage) || (accept === "video" && !isVideo) || (!isImage && !isVideo)) {
      setError(accept === "video" ? "Choose a video file." : accept === "image" ? "Choose a photo (JPG, PNG or WEBP)." : "Choose a photo or a video.");
      return;
    }
    if (isImage && file.size > MAX_IMAGE) return setError(`Photos must be under ${fileSize(MAX_IMAGE)}.`);
    if (isVideo && file.size > MAX_VIDEO) return setError(`Videos must be under ${fileSize(MAX_VIDEO)}.`);

    setProgress(0);
    onBusyChange?.(true);
    try {
      const ticket = await requestUploadTicket(purpose);
      if (!ticket.ok) throw new Error(ticket.message);
      const media = await uploadWithProgress(file, ticket, setProgress);
      onChange(media);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative">
          <MediaPreview media={value} className="max-h-64" />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2"
            aria-label="Remove"
            disabled={disabled || uploading}
            onClick={() => onChange(undefined)}
          >
            <XIcon />
          </Button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full font-bold"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Spinner /> : accept === "video" ? <FilmIcon /> : value ? <UploadIcon /> : <ImageIcon />}
        {uploading ? `Uploading… ${progress}%` : value ? "Replace" : label ?? (accept === "both" ? "Upload photo or video" : accept === "video" ? "Upload video" : "Upload photo")}
      </Button>
      {uploading ? <Progress value={progress ?? 0} /> : null}
      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
