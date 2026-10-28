"use client";

import * as React from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import { CheckField, Hidden, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { saveAlumniStory } from "@/lib/school/actions/premium";
import type { CloudMedia } from "@/lib/school/types";

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

/* --------------------------------- alumni --------------------------------- */

export interface StoryValue {
  id: string;
  title: string;
  authorName: string;
  graduationYear: number;
  excerpt: string;
  body: string;
  cover?: CloudMedia;
  status: "draft" | "published";
}

export function StoryDialog({ story }: { story?: StoryValue }) {
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(story)} label="Add story" />}
      title={story ? "Edit alumni story" : "Add an alumni story"}
      description="Only publish a story with the written consent of the former pupil (or their parent, if they are under 18)."
      action={saveAlumniStory}
      media={{ purpose: "alumni", accept: "image", initial: story?.cover, label: "Cover photo (optional)" }}
      wide
    >
      <Hidden name="id" value={story?.id} />
      <TextField name="title" label="Title" defaultValue={story?.title} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="authorName" label="Former pupil's name" defaultValue={story?.authorName} required />
        <TextField name="graduationYear" type="number" min={1990} max={2100} label="Year they left" defaultValue={story?.graduationYear} required />
      </div>
      <TextareaField name="excerpt" label="One-line summary" rows={2} defaultValue={story?.excerpt} maxLength={280} />
      <TextareaField name="body" label="Story" rows={10} defaultValue={story?.body} description="Separate paragraphs with a blank line." />
      <CheckField name="published" label="Published on the alumni page" defaultChecked={story?.status === "published"} />
    </FormDialog>
  );
}
