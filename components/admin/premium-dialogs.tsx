"use client";

import * as React from "react";
import { CircleDollarSignIcon, PencilIcon, PlusIcon } from "lucide-react";

import { CheckField, CheckGroupField, Hidden, SelectField, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import {
  markOrderPaid,
  saveAlumniStory,
  saveCampaign,
  saveDigitalResource,
  saveProduct,
} from "@/lib/school/actions/premium";
import { CLASS_LEVELS } from "@/lib/school/config";
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

const LEVEL_OPTIONS = CLASS_LEVELS.map((l) => ({ value: l.id, label: l.name }));

/* ----------------------------- digital library ---------------------------- */

export interface ResourceValue {
  id: string;
  title: string;
  author: string;
  kind: "ebook" | "audiobook" | "video" | "article";
  description: string;
  category: string;
  levelIds: string[];
  url: string;
  media?: CloudMedia;
  minutes?: number;
  published: boolean;
}

export function ResourceDialog({ resource, categories }: { resource?: ResourceValue; categories: string[] }) {
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(resource)} label="Add title" />}
      title={resource ? "Edit digital title" : "Add to the digital library"}
      description="Link to an open-licence e-book or reading site, or upload a read-along video. Pupils see titles matched to their class."
      action={saveDigitalResource}
      media={{ purpose: "library", accept: "video", initial: resource?.media, label: "Read-along video (optional)" }}
      wide
    >
      <Hidden name="id" value={resource?.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="title" label="Title" defaultValue={resource?.title} required />
        <TextField name="author" label="Author or publisher" defaultValue={resource?.author} required />
        <SelectField
          name="kind"
          label="Kind"
          defaultValue={resource?.kind ?? "ebook"}
          options={[
            { value: "ebook", label: "E-book" },
            { value: "audiobook", label: "Audiobook" },
            { value: "video", label: "Read-along video" },
            { value: "article", label: "Article" },
          ]}
        />
        <TextField name="category" label="Category" defaultValue={resource?.category ?? categories[0]} list="digital-categories" />
        <datalist id="digital-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <TextField name="url" type="url" label="Link (https://…)" defaultValue={resource?.media ? "" : resource?.url} placeholder="https://www.africanstorybook.org/…" />
        <TextField name="minutes" type="number" min={1} max={600} label="Reading time (minutes)" defaultValue={resource?.minutes} />
      </div>
      <TextareaField name="description" label="Short description" rows={3} defaultValue={resource?.description} maxLength={600} />
      <CheckGroupField name="levelIds" label="Suitable for (none ticked = everyone)" options={LEVEL_OPTIONS} defaultValues={resource?.levelIds ?? []} columns={3} />
      <CheckField name="published" label="Show to pupils and parents" defaultChecked={resource?.published ?? true} />
    </FormDialog>
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

export interface CampaignValue {
  id: string;
  title: string;
  summary: string;
  description: string;
  goal: number;
  endsAt?: string;
  status: "open" | "closed";
}

export function CampaignDialog({ campaign }: { campaign?: CampaignValue }) {
  return (
    <FormDialog trigger={<Trigger editing={Boolean(campaign)} label="New campaign" />} title={campaign ? "Edit campaign" : "New giving campaign"} action={saveCampaign} wide>
      <Hidden name="id" value={campaign?.id} />
      <TextField name="title" label="Title" defaultValue={campaign?.title} required />
      <TextField name="summary" label="One-line summary" defaultValue={campaign?.summary} required />
      <TextareaField name="description" label="What the money is for" rows={6} defaultValue={campaign?.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="goal" type="number" min={10000} step={1000} label="Goal (₦)" defaultValue={campaign?.goal} required />
        <TextField name="endsAt" type="date" label="Ends (optional)" defaultValue={campaign?.endsAt} />
      </div>
      <CheckField name="open" label="Open for gifts" defaultChecked={campaign ? campaign.status === "open" : true} />
    </FormDialog>
  );
}

/* ---------------------------------- shop ---------------------------------- */

export interface ProductValue {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  variants: { size: string; stock: number }[];
  image?: CloudMedia;
  active: boolean;
}

export function ProductDialog({ product }: { product?: ProductValue }) {
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(product)} label="Add product" />}
      title={product ? `Edit ${product.name}` : "Add a product"}
      action={saveProduct}
      media={{ purpose: "shop", accept: "image", initial: product?.image, label: "Photo (optional)" }}
      wide
    >
      <Hidden name="id" value={product?.id} />
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem_9rem]">
        <TextField name="name" label="Name" defaultValue={product?.name} required />
        <SelectField
          name="category"
          label="Category"
          defaultValue={product?.category ?? "uniform"}
          options={[
            { value: "uniform", label: "Uniform" },
            { value: "sportswear", label: "Sportswear" },
            { value: "books", label: "Books" },
            { value: "stationery", label: "Stationery" },
            { value: "accessories", label: "Accessories" },
          ]}
        />
        <TextField name="price" type="number" min={50} step={50} label="Price (₦)" defaultValue={product?.price} required />
      </div>
      <TextareaField name="description" label="Description" rows={2} defaultValue={product?.description} maxLength={600} />
      <TextareaField
        name="variants"
        label="Sizes and stock"
        rows={5}
        defaultValue={product?.variants.map((x) => `${x.size}: ${x.stock}`).join("\n") ?? "One size: 0"}
        description='One size per line with the number in stock, e.g. "Age 6: 12". Stock is held when a parent orders and returned if the order is cancelled.'
      />
      <CheckField name="active" label="On sale in the portal and website" defaultChecked={product?.active ?? true} />
    </FormDialog>
  );
}

export function MarkPaidDialog({ orderId, orderNo, total }: { orderId: string; orderNo: string; total: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" className="font-bold">
          <CircleDollarSignIcon />
          Paid
        </Button>
      }
      title={`Record payment for ${orderNo}`}
      description={`Confirm ${total} has been received at the bursary or by transfer.`}
      action={markOrderPaid}
      submitLabel="Record payment"
    >
      <Hidden name="id" value={orderId} />
      <TextField name="reference" label="Receipt or transfer reference" required />
    </FormDialog>
  );
}
