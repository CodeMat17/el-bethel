"use client";

import * as React from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import { CheckField, Hidden, SelectField, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { saveParent, saveStudent, saveTeacher } from "@/lib/school/actions/admin";
import type { Parent, Student, Teacher } from "@/lib/school/types";

type Option = { value: string; label: string };

// Used as `DialogTrigger` render targets, so they must pass through the injected props (onClick, ref, aria-*).
function AddButton({ label, ...props }: { label: string } & React.ComponentProps<typeof Button>) {
  return (
    <Button size="lg" className="font-bold" {...props}>
      <PlusIcon />
      {label}
    </Button>
  );
}

function EditButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button size="sm" variant="outline" className="font-bold" {...props}>
      <PencilIcon />
      Edit
    </Button>
  );
}

const HOUSES: Option[] = ["Emerald", "Sapphire", "Ruby", "Amber"].map((h) => ({ value: h, label: h }));
const GENDERS: Option[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

export function StudentDialog({
  classes,
  student,
  parentId,
  trigger,
}: {
  classes: Option[];
  student?: Student;
  /** When adding a child from a parent's page, link them straight away. */
  parentId?: string;
  trigger?: React.ReactElement;
}) {
  return (
    <FormDialog
      trigger={trigger ?? (student ? <EditButton /> : <AddButton label="Add pupil" />)}
      title={student ? `Edit ${student.firstName} ${student.lastName}` : "Enrol a pupil"}
      description={student ? undefined : "A student number is assigned automatically."}
      action={saveStudent}
      media={{ purpose: "people", accept: "image", initial: student?.photo, label: "Photo" }}
      wide
    >
      <Hidden name="id" value={student?.id} />
      <Hidden name="parentIds" value={parentId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="firstName" label="First name" defaultValue={student?.firstName} required />
        <TextField name="middleName" label="Middle name" defaultValue={student?.middleName} />
        <TextField name="lastName" label="Last name" defaultValue={student?.lastName} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="dateOfBirth" type="date" label="Date of birth" defaultValue={student?.dateOfBirth} required />
        <SelectField name="gender" label="Gender" options={GENDERS} defaultValue={student?.gender ?? "Male"} />
        <TextField name="nationality" label="Nationality" defaultValue={student?.nationality ?? "Nigerian"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField name="classId" label="Class" options={classes} defaultValue={student?.classId ?? classes[0]?.value} />
        <SelectField name="house" label="House" options={HOUSES} defaultValue={student?.house ?? "Emerald"} />
        <TextField name="bloodGroup" label="Blood group" defaultValue={student?.bloodGroup} placeholder="O+" />
      </div>
      <TextField name="admissionNo" label="Admission number (optional)" defaultValue={student?.admissionNo} />
      <TextareaField name="address" label="Home address" rows={2} defaultValue={student?.address} />
      <TextareaField name="medicalNotes" label="Medical notes (optional)" rows={2} defaultValue={student?.medicalNotes} />
    </FormDialog>
  );
}

export function ParentDialog({ parent, studentId, trigger }: { parent?: Parent; studentId?: string; trigger?: React.ReactElement }) {
  return (
    <FormDialog
      trigger={trigger ?? (parent ? <EditButton /> : <AddButton label="Add parent" />)}
      title={parent ? `Edit ${parent.firstName} ${parent.lastName}` : "Add a parent or guardian"}
      action={saveParent}
      media={{ purpose: "people", accept: "image", initial: parent?.photo, label: "Photo" }}
      wide
    >
      <Hidden name="id" value={parent?.id} />
      <Hidden name="studentIds" value={studentId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="title" label="Title" defaultValue={parent?.title ?? "Mrs."} />
        <TextField name="firstName" label="First name" defaultValue={parent?.firstName} required />
        <TextField name="lastName" label="Last name" defaultValue={parent?.lastName} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          name="relationship"
          label="Relationship"
          options={["Mother", "Father", "Guardian"].map((r) => ({ value: r, label: r }))}
          defaultValue={parent?.relationship ?? "Mother"}
        />
        <TextField name="phone" label="Phone" defaultValue={parent?.phone} required />
        <TextField name="email" type="email" label="Email" defaultValue={parent?.email} />
      </div>
      <TextField name="occupation" label="Occupation" defaultValue={parent?.occupation} />
      <TextareaField name="address" label="Address" rows={2} defaultValue={parent?.address} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="emergencyContactName" label="Emergency contact" defaultValue={parent?.emergencyContactName} />
        <TextField name="emergencyContactPhone" label="Emergency phone" defaultValue={parent?.emergencyContactPhone} />
      </div>
    </FormDialog>
  );
}

export function TeacherDialog({ teacher, departments }: { teacher?: Teacher; departments: string[] }) {
  return (
    <FormDialog
      trigger={teacher ? <EditButton /> : <AddButton label="Add staff member" />}
      title={teacher ? `Edit ${teacher.title} ${teacher.firstName} ${teacher.lastName}` : "Add a staff member"}
      description="Classes and subjects are assigned on the Classes page."
      action={saveTeacher}
      media={{ purpose: "people", accept: "image", initial: teacher?.photo, label: "Photo (shown on the website if featured)" }}
      wide
    >
      <Hidden name="id" value={teacher?.id} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="title" label="Title" defaultValue={teacher?.title ?? "Mrs."} />
        <TextField name="firstName" label="First name" defaultValue={teacher?.firstName} required />
        <TextField name="lastName" label="Last name" defaultValue={teacher?.lastName} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="position" label="Position" defaultValue={teacher?.position ?? "Class Teacher"} />
        <TextField name="department" label="Department" defaultValue={teacher?.department} list="departments" />
        <datalist id="departments">
          {departments.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="email" type="email" label="Email" defaultValue={teacher?.email} />
        <TextField name="phone" label="Phone" defaultValue={teacher?.phone} />
        <TextField name="experienceYears" type="number" min={0} max={60} label="Years of experience" defaultValue={teacher?.experienceYears ?? 0} />
      </div>
      <TextareaField name="qualifications" label="Qualifications (one per line)" rows={2} defaultValue={teacher?.qualifications.join("\n")} />
      <TextareaField name="bio" label="Short bio" rows={3} defaultValue={teacher?.bio} />
      <CheckField name="featured" label="Show on the public website" defaultChecked={teacher?.featured} />
      {teacher ? (
        <CheckField
          name="active"
          label="Currently employed"
          description="Turning this off also disables their sign-in."
          defaultChecked={teacher.active}
        />
      ) : null}
    </FormDialog>
  );
}
