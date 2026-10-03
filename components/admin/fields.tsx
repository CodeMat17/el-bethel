"use client";

import * as React from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* Uncontrolled form fields for admin dialogs. Values are read with FormData. */

export function TextField({
  name,
  label,
  description,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { name: string; label: string; description?: string }) {
  const id = React.useId();
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} name={name} className="h-11" {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export function TextareaField({
  name,
  label,
  description,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & { name: string; label: string; description?: string }) {
  const id = React.useId();
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea id={id} name={name} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  description,
  className,
  placeholder,
  onValueChange,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  description?: string;
  className?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}) {
  const id = React.useId();
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select name={name} defaultValue={defaultValue} items={options} onValueChange={(v) => onValueChange?.(String(v ?? ""))}>
        <SelectTrigger id={id} className="h-11 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export function CheckField({
  name,
  label,
  description,
  defaultChecked,
  value,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  value?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 text-sm">
      <input type="checkbox" name={name} value={value ?? "on"} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-primary" />
      <span>
        <span className="block font-bold">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span> : null}
      </span>
    </label>
  );
}

export function CheckGroupField({
  name,
  label,
  options,
  defaultValues = [],
  columns = 2,
}: {
  name: string;
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  defaultValues?: string[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">{label}</legend>
      <div className={cn("mt-2 grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
        {options.map((o) => (
          <label key={o.value} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-sm", o.disabled && "opacity-50")}>
            <input type="checkbox" name={name} value={o.value} defaultChecked={defaultValues.includes(o.value)} disabled={o.disabled} className="size-4 accent-primary" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Hidden({ name, value }: { name: string; value?: string }) {
  return value ? <input type="hidden" name={name} value={value} /> : null;
}
