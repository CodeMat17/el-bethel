"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { CheckGroupField, Hidden, SelectField, TextField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { saveClass, saveSession, saveSubject, saveTerm, setSubjectTeacher } from "@/lib/school/actions/admin";
import type { AcademicSession, SchoolClass, Subject, Term } from "@/lib/school/types";

type Option = { value: string; label: string };

const NONE = "__none";

export function ClassDialog({ cls, levels, teachers }: { cls?: SchoolClass; levels: Option[]; teachers: Option[] }) {
  return (
    <FormDialog
      trigger={
        cls ? (
          <Button size="sm" variant="ghost" className="font-bold">
            <PencilIcon />
            Edit
          </Button>
        ) : (
          <Button size="lg" className="font-bold">
            <PlusIcon />
            Add class
          </Button>
        )
      }
      title={cls ? `Edit ${cls.name}` : "Add a class"}
      action={(formData) => {
        if (formData.get("classTeacherId") === NONE) formData.delete("classTeacherId");
        return saveClass(formData);
      }}
    >
      <Hidden name="id" value={cls?.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="levelId" label="Level" options={levels} defaultValue={cls?.levelId ?? levels[0]?.value} />
        <TextField name="section" label="Section" defaultValue={cls?.section ?? "A"} maxLength={4} />
      </div>
      <TextField name="name" label="Class name" defaultValue={cls?.name} placeholder="Primary 4A" required />
      <SelectField
        name="classTeacherId"
        label="Class teacher"
        options={[{ value: NONE, label: "None yet" }, ...teachers]}
        defaultValue={cls?.classTeacherId ?? NONE}
        description="The class teacher can publish this class's term results."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="capacity" type="number" min={1} max={200} label="Capacity" defaultValue={cls?.capacity ?? 30} />
        <TextField name="room" label="Room" defaultValue={cls?.room} placeholder="Block A · Room 4" />
      </div>
    </FormDialog>
  );
}

export function SubjectDialog({ subject, levels }: { subject?: Subject; levels: Option[] }) {
  return (
    <FormDialog
      trigger={
        subject ? (
          <Button size="sm" variant="ghost" className="font-bold">
            <PencilIcon />
            Edit
          </Button>
        ) : (
          <Button size="lg" className="font-bold">
            <PlusIcon />
            Add subject
          </Button>
        )
      }
      title={subject ? `Edit ${subject.name}` : "Add a subject"}
      action={saveSubject}
      wide
    >
      <Hidden name="id" value={subject?.id} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="name" label="Name" defaultValue={subject?.name} required className="sm:col-span-2" />
        <TextField name="code" label="Code" defaultValue={subject?.code} placeholder="MTH" maxLength={8} required />
      </div>
      <SelectField
        name="group"
        label="Group"
        options={[
          { value: "core", label: "Core" },
          { value: "additional", label: "Additional" },
        ]}
        defaultValue={subject?.group ?? "core"}
      />
      <CheckGroupField name="levelIds" label="Taught at" options={levels} defaultValues={subject?.levelIds ?? []} columns={3} />
    </FormDialog>
  );
}

export function SessionDialog({ session }: { session?: AcademicSession }) {
  return (
    <FormDialog
      trigger={
        session ? (
          <Button size="sm" variant="ghost" className="font-bold">
            <PencilIcon />
            Edit
          </Button>
        ) : (
          <Button size="lg" className="font-bold">
            <PlusIcon />
            Add session
          </Button>
        )
      }
      title={session ? `Edit ${session.name}` : "Add an academic session"}
      action={saveSession}
    >
      <Hidden name="id" value={session?.id} />
      <TextField name="name" label="Session" defaultValue={session?.name} placeholder="2027/2028" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="startDate" type="date" label="Starts" defaultValue={session?.startDate?.slice(0, 10)} required />
        <TextField name="endDate" type="date" label="Ends" defaultValue={session?.endDate?.slice(0, 10)} required />
      </div>
    </FormDialog>
  );
}

export function TermDialog({ term, sessions, sessionId }: { term?: Term; sessions: Option[]; sessionId?: string }) {
  const d = (v?: string) => v?.slice(0, 10);
  return (
    <FormDialog
      trigger={
        term ? (
          <Button size="sm" variant="ghost" className="font-bold">
            <PencilIcon />
            Edit
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="font-bold">
            <PlusIcon />
            Add term
          </Button>
        )
      }
      title={term ? `Edit ${term.name}` : "Add a term"}
      action={saveTerm}
      wide
    >
      <Hidden name="id" value={term?.id} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField name="sessionId" label="Session" options={sessions} defaultValue={term?.sessionId ?? sessionId ?? sessions[0]?.value} />
        <SelectField
          name="key"
          label="Term"
          options={[
            { value: "first", label: "First" },
            { value: "second", label: "Second" },
            { value: "third", label: "Third" },
          ]}
          defaultValue={term?.key ?? "first"}
        />
        <TextField name="name" label="Name" defaultValue={term?.name} placeholder="First Term" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="startDate" type="date" label="Term starts" defaultValue={d(term?.startDate)} required />
        <TextField name="endDate" type="date" label="Term ends" defaultValue={d(term?.endDate)} required />
        <TextField name="examStart" type="date" label="Exams start" defaultValue={d(term?.examStart)} required />
        <TextField name="examEnd" type="date" label="Exams end" defaultValue={d(term?.examEnd)} required />
      </div>
      <TextField name="resultPublishDate" type="date" label="Results due" defaultValue={d(term?.resultPublishDate)} />
    </FormDialog>
  );
}

/** One subject row on a class page: pick the teacher and save. */
export function SubjectTeacherPicker({
  classId,
  subjectId,
  teacherId,
  teachers,
}: {
  classId: string;
  subjectId: string;
  teacherId?: string;
  teachers: Option[];
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(teacherId ?? NONE);
  const [pending, startTransition] = React.useTransition();
  const dirty = value !== (teacherId ?? NONE);

  function save() {
    startTransition(async () => {
      const res = await setSubjectTeacher(classId, subjectId, value === NONE ? "" : value);
      if (!res.ok) {
        toast.error("Not saved", { description: res.message });
        return;
      }
      toast.success(res.message ?? "Saved");
      router.refresh();
    });
  }

  const options = [{ value: NONE, label: "Not assigned" }, ...teachers];
  return (
    <div className="flex items-center gap-2">
      <Select value={value} items={options} onValueChange={(v) => setValue(String(v))} disabled={pending}>
        <SelectTrigger className="h-9 w-full min-w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" className="font-bold" disabled={!dirty || pending} onClick={save}>
        {pending ? <Spinner /> : <SaveIcon />}
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
