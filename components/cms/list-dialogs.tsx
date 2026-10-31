"use client";

import type * as React from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Hidden, SelectField, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { saveClub, saveFaq, saveTestimonial } from "@/lib/school/actions/site";
import type { Club, FaqItem, Testimonial } from "@/lib/school/types";

// DialogTrigger's `render` clones this element with its click handler and ref,
// so those props must reach the Button or the dialog never opens.
function Trigger({ editing, label, ...props }: { editing: boolean; label: string } & React.ComponentProps<typeof Button>) {
  return editing ? (
    <Button {...props} size="sm" variant="outline" className="font-bold">
      <PencilIcon />
      Edit
    </Button>
  ) : (
    <Button {...props} size="lg" className="font-bold">
      <PlusIcon />
      {label}
    </Button>
  );
}

export function TestimonialDialog({ item }: { item?: Testimonial }) {
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(item)} label="New testimonial" />}
      title={item ? "Edit testimonial" : "New testimonial"}
      description="Shown on the homepage under “What families say”. Only publish words the family has agreed to share."
      action={saveTestimonial}
    >
      <Hidden name="id" value={item?.id} />
      <TextareaField name="quote" label="What they said" rows={4} defaultValue={item?.quote} required maxLength={800} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={item?.name} placeholder="Mrs. A. Bello" required maxLength={80} />
        <TextField name="relationship" label="Relationship" defaultValue={item?.relationship} placeholder="Parent, Primary 4" maxLength={80} />
      </div>
    </FormDialog>
  );
}

const CLUB_CATEGORIES = [
  { value: "stem", label: "Science & technology" },
  { value: "arts", label: "Arts" },
  { value: "sports", label: "Sports" },
  { value: "literary", label: "Reading & debate" },
  { value: "service", label: "Service" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => ({ value: d, label: d }));

export function ClubDialog({ club }: { club?: Club }) {
  return (
    <FormDialog trigger={<Trigger editing={Boolean(club)} label="New club" />} title={club ? "Edit club" : "New club"} action={saveClub}>
      <Hidden name="id" value={club?.id} />
      <TextField name="name" label="Name" defaultValue={club?.name} required maxLength={80} />
      <TextareaField name="description" label="Description" rows={3} defaultValue={club?.description} maxLength={400} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="category" label="Category" options={CLUB_CATEGORIES} defaultValue={club?.category ?? "stem"} />
        <TextField name="memberCount" type="number" min={0} label="Members" defaultValue={club?.memberCount ?? 0} />
        <SelectField name="meetingDay" label="Meets on" options={DAYS} defaultValue={club?.meetingDay ?? "Wednesday"} />
        <TextField name="meetingTime" label="Time" defaultValue={club?.meetingTime ?? "2:30 PM"} placeholder="2:30 PM" maxLength={40} />
      </div>
    </FormDialog>
  );
}

export function FaqDialog({ faq, categories }: { faq?: FaqItem; categories: string[] }) {
  return (
    <FormDialog trigger={<Trigger editing={Boolean(faq)} label="New question" />} title={faq ? "Edit question" : "New question"} action={saveFaq} wide>
      <Hidden name="id" value={faq?.id} />
      <TextField name="question" label="Question" defaultValue={faq?.question} required maxLength={300} />
      <TextareaField name="answer" label="Answer" rows={5} defaultValue={faq?.answer} required maxLength={3000} />
      <TextField name="category" label="Category" list="faq-categories" defaultValue={faq?.category ?? categories[0] ?? "Admissions"} maxLength={60} />
      <datalist id="faq-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </FormDialog>
  );
}
