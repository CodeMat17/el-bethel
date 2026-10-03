"use client";

import * as React from "react";
import { ImagePlusIcon, PencilIcon, PlusIcon } from "lucide-react";

import { CheckField, Hidden, SelectField, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { addGalleryItem, saveEvent, saveNews, saveNotice, updateGalleryItem } from "@/lib/school/actions/admin";
import type { EmergencyNotice, GalleryItem, NewsPost, SchoolEvent } from "@/lib/school/types";

function toLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Trigger({ editing, label }: { editing: boolean; label: string }) {
  return editing ? (
    <Button size="sm" variant="outline" className="font-bold">
      <PencilIcon />
      Edit
    </Button>
  ) : (
    <Button size="lg" className="font-bold">
      <PlusIcon />
      {label}
    </Button>
  );
}

export function NewsDialog({ post, categories }: { post?: NewsPost; categories: string[] }) {
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(post)} label="New post" />}
      title={post ? "Edit post" : "New news post"}
      description="Published posts appear on the website's News page straight away."
      action={saveNews}
      media={{ purpose: "news", accept: "image", initial: post?.cover, label: "Cover photo" }}
      wide
    >
      <Hidden name="id" value={post?.id} />
      <TextField name="title" label="Title" defaultValue={post?.title} required maxLength={160} />
      <TextareaField name="excerpt" label="Summary" rows={2} defaultValue={post?.excerpt} maxLength={300} description="Shown on the News page and in search results." />
      <TextareaField name="content" label="Article" rows={10} defaultValue={post?.content} description="Leave a blank line between paragraphs." />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="category" label="Category" defaultValue={post?.category ?? categories[0]} list="news-categories" required />
        <datalist id="news-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <TextField name="tags" label="Tags (comma separated)" defaultValue={post?.tags.join(", ")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          name="status"
          label="Status"
          options={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "scheduled", label: "Scheduled" },
            { value: "archived", label: "Archived" },
          ]}
          defaultValue={post?.status ?? "published"}
        />
        <TextField name="publishedAt" type="datetime-local" label="Publish date" defaultValue={toLocal(post?.publishedAt ?? new Date().toISOString())} />
        <TextField name="authorName" label="Author" defaultValue={post?.authorName} placeholder="School Office" />
      </div>
      <CheckField name="featured" label="Feature on the home page" defaultChecked={post?.featured} />
      <details className="rounded-xl border p-3">
        <summary className="cursor-pointer text-sm font-bold">Search engine settings (optional)</summary>
        <div className="mt-3 space-y-3">
          <TextField name="seoTitle" label="SEO title" defaultValue={post?.seoTitle} />
          <TextareaField name="seoDescription" label="SEO description" rows={2} defaultValue={post?.seoDescription} />
        </div>
      </details>
    </FormDialog>
  );
}

export function EventDialog({ event }: { event?: SchoolEvent }) {
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(event)} label="New event" />}
      title={event ? "Edit event" : "New event"}
      action={saveEvent}
      media={{ purpose: "events", accept: "image", initial: event?.cover, label: "Event photo (optional)" }}
      wide
    >
      <Hidden name="id" value={event?.id} />
      <TextField name="title" label="Title" defaultValue={event?.title} required />
      <TextareaField name="description" label="Description" rows={4} defaultValue={event?.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="date" type="date" label="Date" defaultValue={event?.date?.slice(0, 10)} required />
        <TextField name="endDate" type="date" label="End date (optional)" defaultValue={event?.endDate?.slice(0, 10)} />
        <TextField name="startTime" type="time" label="Starts" defaultValue={event?.startTime ?? "09:00"} />
        <TextField name="endTime" type="time" label="Ends" defaultValue={event?.endTime ?? "12:00"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="venue" label="Venue" defaultValue={event?.venue} />
        <SelectField
          name="category"
          label="Category"
          options={["academic", "sports", "cultural", "parents", "holiday", "assessment", "alumni"].map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
          defaultValue={event?.category ?? "academic"}
        />
      </div>
      <CheckField name="requiresRegistration" label="Requires registration" defaultChecked={event?.requiresRegistration} />
      {event ? <CheckField name="cancelled" label="Cancelled" defaultChecked={event.status === "cancelled"} /> : null}
    </FormDialog>
  );
}

export function GalleryUploadDialog({ categories }: { categories: string[] }) {
  return (
    <FormDialog
      trigger={
        <Button size="lg" className="font-bold">
          <ImagePlusIcon />
          Upload photo or video
        </Button>
      }
      title="Add to the gallery"
      description="Photos and videos are stored on Cloudinary. Only add images of pupils whose parents have given consent."
      action={(formData, media) => (media ? addGalleryItem(formData, media) : Promise.resolve({ ok: false, message: "Upload a photo or video first." }))}
      media={{ purpose: "gallery", accept: "both", required: true }}
      submitLabel="Add to gallery"
    >
      <TextField name="title" label="Title" required />
      <TextareaField name="caption" label="Caption" rows={2} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="category" label="Category" list="gallery-categories" defaultValue={categories[0]} />
        <datalist id="gallery-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <TextField name="takenAt" type="date" label="Taken on" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <CheckField name="consentCleared" label="Consent cleared — show on the public website" description="Leave unticked to keep it hidden until consent is confirmed." />
    </FormDialog>
  );
}

export function GalleryEditDialog({ item, categories }: { item: GalleryItem; categories: string[] }) {
  return (
    <FormDialog trigger={<Trigger editing label="" />} title="Edit gallery item" action={updateGalleryItem}>
      <Hidden name="id" value={item.id} />
      <TextField name="title" label="Title" defaultValue={item.title} required />
      <TextareaField name="caption" label="Caption" rows={2} defaultValue={item.caption} />
      <TextField name="category" label="Category" list="gallery-categories-edit" defaultValue={item.category} />
      <datalist id="gallery-categories-edit">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <CheckField name="consentCleared" label="Consent cleared — show on the public website" defaultChecked={item.consentCleared} />
    </FormDialog>
  );
}

export function NoticeDialog({ notice }: { notice?: EmergencyNotice }) {
  const start = notice?.startsAt ?? new Date().toISOString();
  const end = notice?.endsAt ?? new Date(Date.now() + 2 * 86400000).toISOString();
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(notice)} label="New notice" />}
      title={notice ? "Edit notice" : "New emergency notice"}
      description="Active notices show as a banner across the website while they run."
      action={saveNotice}
    >
      <Hidden name="id" value={notice?.id} />
      <TextField name="title" label="Title" defaultValue={notice?.title} required />
      <TextareaField name="body" label="Message" rows={3} defaultValue={notice?.body} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="priority"
          label="Priority"
          options={[
            { value: "high", label: "High" },
            { value: "critical", label: "Critical" },
          ]}
          defaultValue={notice?.priority ?? "high"}
        />
        <SelectField
          name="audience"
          label="Audience"
          options={[
            { value: "all", label: "Everyone" },
            { value: "parents", label: "Parents" },
            { value: "staff", label: "Staff" },
            { value: "pupils", label: "Pupils" },
          ]}
          defaultValue={notice?.audience ?? "all"}
        />
        <TextField name="startsAt" type="datetime-local" label="Starts" defaultValue={toLocal(start)} />
        <TextField name="endsAt" type="datetime-local" label="Ends" defaultValue={toLocal(end)} />
      </div>
      <CheckField name="active" label="Active" defaultChecked={notice?.active ?? true} />
    </FormDialog>
  );
}
