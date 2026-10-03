"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { addAvailability, type SimpleState as TeachingState } from "@/lib/school/actions/portal";

const INITIAL: TeachingState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full font-bold" disabled={pending}>
      {pending ? <Spinner /> : <PlusIcon />}
      {pending ? "Publishing…" : "Publish slot"}
    </Button>
  );
}

export function AvailabilityForm() {
  const [state, action] = useActionState<TeachingState, FormData>(addAvailability, INITIAL);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Slot published", { description: state.message });
      formRef.current?.reset();
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="slot-date">Date</FieldLabel>
        <Input id="slot-date" name="date" type="date" required className="h-11" />
      </Field>
      <Field>
        <FieldLabel htmlFor="slot-time">Time</FieldLabel>
        <Input id="slot-time" name="time" type="time" required className="h-11" />
      </Field>
      <SubmitButton />
    </form>
  );
}
