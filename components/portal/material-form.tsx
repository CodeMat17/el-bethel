"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TriangleAlertIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { MediaUpload } from "@/components/media-upload";
import type { TeachingOption } from "@/components/portal/assignment-form";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { addMaterial } from "@/lib/school/actions/teaching";
import type { CloudMedia, LearningMaterial } from "@/lib/school/types";

const KINDS: { value: LearningMaterial["kind"]; label: string }[] = [
  { value: "note", label: "Lesson notes" },
  { value: "worksheet", label: "Worksheet" },
  { value: "video", label: "Video" },
  { value: "image", label: "Photo or diagram" },
  { value: "link", label: "Link to a website" },
  { value: "pdf", label: "PDF (link)" },
  { value: "slides", label: "Slides (link)" },
  { value: "audio", label: "Audio (link)" },
];

export function MaterialForm({ options, defaultClassId }: { options: TeachingOption[]; defaultClassId?: string }) {
  const router = useRouter();
  const first = options.find((o) => o.classId === defaultClassId) ?? options[0];
  const [classId, setClassId] = React.useState(first?.classId ?? "");
  const [subjectId, setSubjectId] = React.useState(first?.subjects[0]?.id ?? "");
  const [kind, setKind] = React.useState<LearningMaterial["kind"]>("note");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [media, setMedia] = React.useState<CloudMedia | undefined>();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const subjects = options.find((o) => o.classId === classId)?.subjects ?? [];
  const usesUpload = kind === "video" || kind === "image";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 3) return setError("Give the material a title.");
    if (usesUpload && !media) return setError(kind === "video" ? "Upload the video first." : "Upload the photo first.");
    if (!usesUpload && url && !/^https:\/\//.test(url.trim())) return setError("Links must start with https://");
    startTransition(async () => {
      const res = await addMaterial({
        title,
        description,
        classId,
        subjectId,
        kind,
        url: usesUpload ? undefined : url.trim() || undefined,
        media: usesUpload ? media : undefined,
      });
      if (!res.ok) {
        setError(res.message ?? "The material was not published.");
        return;
      }
      toast.success("Material published", { description: res.message });
      setTitle("");
      setDescription("");
      setUrl("");
      setMedia(undefined);
      router.refresh();
    });
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <Field>
        <FieldLabel htmlFor="m-class">Class</FieldLabel>
        <Select
          value={classId}
          items={options.map((o) => ({ value: o.classId, label: o.className }))}
          onValueChange={(v) => {
            const next = options.find((o) => o.classId === v);
            setClassId(String(v));
            setSubjectId(next?.subjects[0]?.id ?? "");
          }}
          disabled={busy}
        >
          <SelectTrigger id="m-class" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.classId} value={o.classId}>
                {o.className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="m-subject">Subject</FieldLabel>
        <Select value={subjectId} items={subjects.map((s) => ({ value: s.id, label: s.name }))} onValueChange={(v) => setSubjectId(String(v))} disabled={busy}>
          <SelectTrigger id="m-subject" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="m-kind">Type</FieldLabel>
        <Select value={kind} items={KINDS} onValueChange={(v) => setKind(v as LearningMaterial["kind"])} disabled={busy}>
          <SelectTrigger id="m-kind" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="m-title">Title</FieldLabel>
        <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} className="h-11" disabled={busy} />
      </Field>

      <Field>
        <FieldLabel htmlFor="m-description">Description</FieldLabel>
        <Textarea id="m-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} disabled={busy} />
      </Field>

      {usesUpload ? (
        <Field>
          <FieldLabel>{kind === "video" ? "Video" : "Photo"}</FieldLabel>
          <MediaUpload purpose="materials" accept={kind === "video" ? "video" : "image"} value={media} onChange={setMedia} onBusyChange={setUploading} disabled={pending} />
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="m-url">Link (optional)</FieldLabel>
          <Input id="m-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="h-11" disabled={busy} />
          <FieldDescription>For documents, share a link (for example Google Drive). Photos and videos can be uploaded.</FieldDescription>
        </Field>
      )}

      <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={busy}>
        {pending ? <Spinner /> : <UploadIcon />}
        {pending ? "Publishing…" : "Publish to class"}
      </Button>
    </form>
  );
}
