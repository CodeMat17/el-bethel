"use client";

import * as React from "react";
import { AtSignIcon, KeyRoundIcon, MailIcon, RefreshCwIcon, ShieldIcon, UserPlusIcon } from "lucide-react";

import { CheckGroupField, Hidden, TextField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { changeSignInEmail, createLogin, resetPassword, sendSignInInvite, updateRoles } from "@/lib/school/actions/admin";
import type { Role } from "@/lib/school/types";

const WORDS = ["Sun", "Lake", "Star", "Moon", "Tree", "Bird", "Rock", "Leaf", "Wave", "Rain", "Gold", "Blue"];

function generatePassword() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  const digits = String(Math.floor(10000 + Math.random() * 90000));
  return `${pick()}-${digits}-${pick()}`;
}

export function suggestUsername(name: string, suffix = ""): string {
  const parts = name
    .replace(/^(Mrs|Mr|Miss|Dr|Mme|Prof)\.?\s+/i, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const base = parts.length >= 2 ? `${parts[0]}_${parts[parts.length - 1]}` : parts[0] ?? "user";
  return `${base}${suffix}`.slice(0, 32);
}

function PasswordField({ name = "password", label = "Password" }: { name?: string; label?: string }) {
  const [value, setValue] = React.useState(generatePassword);
  return (
    <Field>
      <FieldLabel htmlFor={`pw-${name}`}>{label}</FieldLabel>
      <div className="flex gap-2">
        <Input id={`pw-${name}`} name={name} value={value} onChange={(e) => setValue(e.target.value)} minLength={15} className="h-11 font-mono" autoComplete="off" />
        <Button type="button" variant="outline" size="icon-lg" aria-label="Generate another password" onClick={() => setValue(generatePassword())}>
          <RefreshCwIcon />
        </Button>
      </div>
      <FieldDescription>Generated for you; press the arrows for a new one. Write it down and give it to them in person.</FieldDescription>
    </Field>
  );
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "super_admin", label: "Super administrator" },
  { value: "site_admin", label: "Site administrator (website content only)" },
  { value: "teacher", label: "Teacher" },
];

/**
 * Create a sign-in for a pupil, parent, teacher or administrator. The role is
 * fixed by the profile it is linked to; staff accounts can also be made admins.
 */
export function CreateLoginDialog({
  kind,
  name,
  email,
  profileId,
  userId,
  usernameSuffix,
  canGrantAdmin,
  trigger,
}: {
  kind: "pupil" | "parent" | "teacher" | "staff";
  name?: string;
  email?: string;
  profileId?: string;
  userId?: string;
  usernameSuffix?: string;
  canGrantAdmin: boolean;
  trigger?: React.ReactElement;
}) {
  const fixedRole: Role | null = kind === "pupil" ? "pupil" : kind === "parent" ? "parent" : null;
  const roleOptions = ROLE_OPTIONS.filter((r) => {
    if (r.value === "teacher") return kind === "teacher";
    return canGrantAdmin;
  });

  return (
    <FormDialog
      trigger={
        trigger ?? (
          <Button size="sm" variant="outline" className="font-bold">
            <UserPlusIcon />
            Create sign-in
          </Button>
        )
      }
      title={name ? `Create a sign-in for ${name}` : "Create a staff sign-in"}
      description={
        kind === "pupil"
          ? "Pupils sign in with an email address and the password below. Use an address the pupil or their parent can check."
          : "They sign in with their email address and the password below."
      }
      action={createLogin}
      submitLabel="Create sign-in"
      pendingLabel="Creating…"
    >
      <Hidden name="userId" value={userId} />
      <Hidden name="studentId" value={kind === "pupil" ? profileId : undefined} />
      <Hidden name="parentId" value={kind === "parent" ? profileId : undefined} />
      <Hidden name="teacherId" value={kind === "teacher" ? profileId : undefined} />
      <TextField name="name" label="Full name" defaultValue={name} required />
      <TextField
        name="username"
        label="Username"
        defaultValue={name ? suggestUsername(name, usernameSuffix) : ""}
        pattern="[a-z0-9_]{4,32}"
        autoCapitalize="none"
        description="4–32 lowercase letters, numbers or underscores. Must be unique."
        required
      />
      <TextField
        name="email"
        type="email"
        label="Email"
        defaultValue={email}
        autoCapitalize="none"
        description="Used to sign in. Must not belong to another account."
        required
      />
      <PasswordField />
      {fixedRole ? (
        <input type="hidden" name="roles" value={fixedRole} />
      ) : (
        <CheckGroupField
          name="roles"
          label="Roles"
          options={roleOptions}
          defaultValues={kind === "teacher" ? ["teacher"] : ["admin"]}
          columns={1}
        />
      )}
      {!fixedRole && !canGrantAdmin && kind === "staff" ? (
        <p className="text-sm text-muted-foreground">Only a super administrator can create administrator accounts.</p>
      ) : null}
    </FormDialog>
  );
}

/** Email the set-your-password link again to someone who hasn't signed in yet. */
export function SendInviteButton({ userId, name }: { userId: string; name: string }) {
  return (
    <ConfirmAction
      action={sendSignInInvite.bind(null, userId)}
      icon={<MailIcon />}
      variant="ghost"
      pendingText="Sending…"
      confirm={{
        title: `Email ${name} a sign-in link?`,
        description: "Only if they check email: they'll get a link to choose their own password. The password the school gave them keeps working until then.",
        confirmLabel: "Send invite",
      }}
    >
      Send invite
    </ConfirmAction>
  );
}

export function ResetPasswordDialog({ userId, name }: { userId: string; name: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="ghost" className="font-bold">
          <KeyRoundIcon />
          Reset password
        </Button>
      }
      title={`Reset ${name}'s password`}
      description="A new password is generated below. They will be signed out on every device and must use the new one, so give it to them in person."
      action={resetPassword}
      submitLabel="Set new password"
      pendingLabel="Updating…"
    >
      <Hidden name="userId" value={userId} />
      <PasswordField label="New password" />
    </FormDialog>
  );
}

export function ChangeEmailDialog({ userId, name, email }: { userId: string; name: string; email?: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="ghost" className="font-bold">
          <AtSignIcon />
          Change email
        </Button>
      }
      title={`Change ${name}'s sign-in email`}
      description="They will sign in with the new email from now on. Their password stays the same."
      action={changeSignInEmail}
      submitLabel="Save email"
      pendingLabel="Saving…"
    >
      <Hidden name="userId" value={userId} />
      <TextField
        name="email"
        type="email"
        label="New email"
        defaultValue={email}
        autoCapitalize="none"
        description="Must not belong to another account."
        required
      />
    </FormDialog>
  );
}

export function RolesDialog({
  userId,
  name,
  roles,
  canGrantAdmin,
  hasTeacher,
  hasParent,
  hasStudent,
}: {
  userId: string;
  name: string;
  roles: Role[];
  canGrantAdmin: boolean;
  hasTeacher: boolean;
  hasParent: boolean;
  hasStudent: boolean;
}) {
  const options: { value: Role; label: string; disabled?: boolean }[] = [
    { value: "super_admin", label: "Super administrator", disabled: !canGrantAdmin },
    { value: "admin", label: "Administrator", disabled: !canGrantAdmin },
    { value: "site_admin", label: "Site administrator (website content only)", disabled: !canGrantAdmin },
    { value: "teacher", label: "Teacher", disabled: !hasTeacher },
    { value: "parent", label: "Parent", disabled: !hasParent },
    { value: "pupil", label: "Pupil", disabled: !hasStudent },
  ];
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="ghost" className="font-bold">
          <ShieldIcon />
          Roles
        </Button>
      }
      title={`Roles for ${name}`}
      description="Roles decide which portal they see and what they can do. Teacher, parent and pupil roles need a linked record."
      action={updateRoles}
      submitLabel="Save roles"
    >
      <Hidden name="userId" value={userId} />
      {/* Disabled checkboxes are not submitted, so keep roles the viewer cannot change. */}
      {roles
        .filter((r) => options.find((o) => o.value === r)?.disabled)
        .map((r) => (
          <input key={r} type="hidden" name="roles" value={r} />
        ))}
      <CheckGroupField name="roles" label="Roles" options={options} defaultValues={roles} columns={1} />
    </FormDialog>
  );
}
