"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  HistoryIcon,
  PlusIcon,
  RocketIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
  UndoIcon,
} from "lucide-react";

import { Icon, ICON_NAMES } from "@/components/icon";
import { MediaUpload } from "@/components/media-upload";
import { ConfirmAction } from "@/components/portal/confirm-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { discardCmsDraft, publishCms, restoreCmsVersion, saveCmsDraft } from "@/lib/school/actions/cms";
import type { CmsDocumentSpec, CmsField, CmsSection } from "@/lib/school/cms/editor-spec";
import { CMS_TOKENS } from "@/lib/school/cms/tokens";
import { CLASS_LEVELS } from "@/lib/school/config";
import type { CloudMedia } from "@/lib/school/types";
import { cn } from "@/lib/utils";

type Obj = Record<string, unknown>;

export interface CmsEditorStatus {
  hasDraft: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  publishedBy: string | null;
  draftUpdatedAt: string | null;
  draftUpdatedBy: string | null;
  versions: { id: string; publishedAt: string; publishedBy: string; note: string | null }[];
}

/* --------------------------------- helpers -------------------------------- */

const asObj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});

function when(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* ---------------------------------- fields -------------------------------- */

function FieldBox({ label, help, htmlFor, children }: { label: string; help?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <Field>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {help ? <FieldDescription>{help}</FieldDescription> : null}
    </Field>
  );
}

function TextInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "text" }>; value: unknown; onChange: (v: string) => void }) {
  const id = React.useId();
  const text = typeof value === "string" ? value : "";
  return (
    <FieldBox label={field.label} help={field.help} htmlFor={id}>
      {field.rows ? (
        <Textarea id={id} rows={field.rows} value={text} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} className="h-11" value={text} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </FieldBox>
  );
}

function NumberInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "number" }>; value: unknown; onChange: (v: number) => void }) {
  const id = React.useId();
  return (
    <FieldBox label={field.label} help={field.help} htmlFor={id}>
      <Input
        id={id}
        type="number"
        min={0}
        inputMode="numeric"
        className="h-11"
        value={typeof value === "number" ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </FieldBox>
  );
}

function LinkInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "link" }>; value: unknown; onChange: (v: Obj) => void }) {
  const link = asObj(value);
  const labelId = React.useId();
  const hrefId = React.useId();
  return (
    <fieldset className="rounded-xl border p-3">
      <legend className="px-1 text-sm font-bold">{field.label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldBox label="Button text" htmlFor={labelId}>
          <Input id={labelId} className="h-11" value={String(link.label ?? "")} onChange={(e) => onChange({ ...link, label: e.target.value })} />
        </FieldBox>
        <FieldBox label="Goes to" htmlFor={hrefId} help="A page like /admissions, or a full https:// link.">
          <Input id={hrefId} className="h-11" value={String(link.href ?? "")} onChange={(e) => onChange({ ...link, href: e.target.value })} />
        </FieldBox>
      </div>
    </fieldset>
  );
}

function IconInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "icon" }>; value: unknown; onChange: (v: string) => void }) {
  const id = React.useId();
  const current = typeof value === "string" ? value : "Sparkles";
  const options = ICON_NAMES.map((name) => ({ value: name, label: name }));
  return (
    <FieldBox label={field.label} htmlFor={id}>
      <Select value={current} items={options} onValueChange={(v) => onChange(String(v ?? "Sparkles"))}>
        <SelectTrigger id={id} className="h-11 w-full">
          <span className="flex items-center gap-2">
            <Icon name={current} className="size-4" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <Icon name={o.value} className="size-4" />
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldBox>
  );
}

function ImageInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "image" }>; value: unknown; onChange: (v: CloudMedia | null) => void }) {
  const media = value && typeof value === "object" ? (value as CloudMedia) : undefined;
  return (
    <FieldBox label={field.label} help={field.help ?? (media ? undefined : "No photo chosen, so the current built-in photo is used.")}>
      <MediaUpload purpose="site" accept="image" value={media} onChange={(m) => onChange(m ?? null)} />
    </FieldBox>
  );
}

function BooleanInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "boolean" }>; value: unknown; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <Switch checked={value === true} onCheckedChange={onChange} className="mt-0.5" />
      <span>
        <span className="block font-bold">{field.label}</span>
        {field.help ? <span className="block text-muted-foreground">{field.help}</span> : null}
      </span>
    </label>
  );
}

function LevelsInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "levels" }>; value: unknown; onChange: (v: string[]) => void }) {
  const chosen = new Set(Array.isArray(value) ? value.map(String) : []);
  return (
    <FieldBox label={field.label} help={field.help}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CLASS_LEVELS.map((level) => (
          <label key={level.id} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
            <Checkbox
              checked={chosen.has(level.id)}
              onCheckedChange={(checked) => {
                const next = new Set(chosen);
                if (checked) next.add(level.id);
                else next.delete(level.id);
                onChange(CLASS_LEVELS.map((l) => l.id).filter((id) => next.has(id)));
              }}
            />
            {level.name}
          </label>
        ))}
      </div>
    </FieldBox>
  );
}

function RowControls({ index, count, onMove, onRemove, label }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ArrowUpIcon />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        <ArrowDownIcon />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${label}`} onClick={onRemove}>
        <Trash2Icon />
      </Button>
    </div>
  );
}

function StringsInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "strings" }>; value: unknown; onChange: (v: string[]) => void }) {
  const list = Array.isArray(value) ? value.map(String) : [];
  return (
    <FieldBox label={field.label} help={field.help}>
      <ul className="space-y-2">
        {list.map((item, i) => (
          <li key={i} className={cn("flex gap-2", field.rows ? "items-start" : "items-center")}>
            {field.rows ? (
              <Textarea
                rows={field.rows}
                aria-label={`${field.itemLabel} ${i + 1}`}
                value={item}
                onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ) : (
              <Input
                className="h-10"
                aria-label={`${field.itemLabel} ${i + 1}`}
                value={item}
                onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
              />
            )}
            <RowControls
              index={i}
              count={list.length}
              label={`${field.itemLabel.toLowerCase()} ${i + 1}`}
              onMove={(to) => onChange(move(list, i, to))}
              onRemove={() => onChange(list.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" className="w-fit font-bold" disabled={list.length >= field.max} onClick={() => onChange([...list, ""])}>
        <PlusIcon />
        Add {field.itemLabel.toLowerCase()}
      </Button>
    </FieldBox>
  );
}

function ItemsInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "items" }>; value: unknown; onChange: (v: Obj[]) => void }) {
  const list = Array.isArray(value) ? value.map(asObj) : [];
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <FieldBox label={field.label} help={field.help}>
      <ul className="space-y-2">
        {list.map((item, i) => {
          const title = String(item[field.titleField] ?? "").trim() || `${field.itemLabel} ${i + 1}`;
          const expanded = open === i;
          return (
            <li key={i} className="rounded-xl border bg-muted/30">
              <div className="flex items-center gap-2 p-2 pl-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-bold"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : i)}
                >
                  <ChevronDownIcon className={cn("size-4 shrink-0 transition-transform", !expanded && "-rotate-90")} />
                  {typeof item.icon === "string" ? <Icon name={item.icon} className="size-4 shrink-0 text-muted-foreground" /> : null}
                  <span className="truncate">{title}</span>
                </button>
                {field.fixed ? null : <RowControls
                  index={i}
                  count={list.length}
                  label={title}
                  onMove={(to) => {
                    onChange(move(list, i, to));
                    setOpen(expanded ? to : open);
                  }}
                  onRemove={() => {
                    onChange(list.filter((_, j) => j !== i));
                    setOpen(null);
                  }}
                />}
              </div>
              {expanded ? (
                <div className="space-y-4 border-t p-3">
                  <Fields fields={field.fields} value={item} onChange={(next) => onChange(list.map((x, j) => (j === i ? next : x)))} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {field.fixed ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit font-bold"
          disabled={list.length >= field.max}
          onClick={() => {
            onChange([...list, structuredClone(field.blank)]);
            setOpen(list.length);
          }}
        >
          <PlusIcon />
          Add {field.itemLabel.toLowerCase()}
        </Button>
      )}
    </FieldBox>
  );
}

function Fields({ fields, value, onChange }: { fields: CmsField[]; value: Obj; onChange: (next: Obj) => void }) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });
  return (
    <>
      {fields.map((field) => {
        const v = value[field.name];
        switch (field.kind) {
          case "text":
            return <TextInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "number":
            return <NumberInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "link":
            return <LinkInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "icon":
            return <IconInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "image":
            return <ImageInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "boolean":
            return <BooleanInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "levels":
            return <LevelsInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "strings":
            return <StringsInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
          case "items":
            return <ItemsInput key={field.name} field={field} value={v} onChange={(x) => set(field.name, x)} />;
        }
      })}
    </>
  );
}

/* --------------------------------- sections ------------------------------- */

function SectionCard({
  section,
  value,
  onChange,
  defaultOpen,
}: {
  section: CmsSection;
  value: Obj;
  onChange: (next: Obj) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const scope = section.path ? asObj(value[section.path]) : value;
  const update = (next: Obj) => onChange(section.path ? { ...value, [section.path]: next } : next);
  const shown = section.toggle ? scope.visible !== false : true;

  return (
    <Card className={cn("gap-0 p-0", !shown && "border-dashed bg-muted/30")}>
      <div className="flex items-center gap-3 p-4 sm:px-5">
        <button type="button" className="flex min-w-0 flex-1 items-start gap-2 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
          <ChevronDownIcon className={cn("mt-0.5 size-5 shrink-0 transition-transform", !open && "-rotate-90")} />
          <span className="min-w-0">
            <span className="flex items-center gap-2 font-heading text-base font-extrabold">
              {section.title}
              {!shown ? (
                <Badge variant="secondary" className="font-bold">
                  Hidden
                </Badge>
              ) : null}
            </span>
            {section.description ? <span className="mt-0.5 block text-sm text-muted-foreground">{section.description}</span> : null}
          </span>
        </button>
        {section.toggle ? (
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-bold">
            {shown ? <EyeIcon className="size-4 text-muted-foreground" /> : <EyeOffIcon className="size-4 text-muted-foreground" />}
            <span className="hidden sm:inline">{shown ? "Shown" : "Hidden"}</span>
            <Switch checked={shown} onCheckedChange={(checked) => update({ ...scope, visible: checked })} aria-label={`Show ${section.title}`} />
          </label>
        ) : null}
      </div>
      {open ? (
        <div className="space-y-4 border-t p-4 sm:p-5">
          <Fields fields={section.fields} value={scope} onChange={update} />
        </div>
      ) : null}
    </Card>
  );
}

/* --------------------------------- editor --------------------------------- */

export function CmsEditor({ spec, initial, status }: { spec: CmsDocumentSpec; initial: unknown; status: CmsEditorStatus }) {
  const router = useRouter();
  const [value, setValue] = React.useState<Obj>(() => asObj(initial));
  const [savedJson, setSavedJson] = React.useState(() => JSON.stringify(initial));
  const [busy, setBusy] = React.useState<null | "save" | "preview" | "publish" | "discard">(null);
  const [confirm, setConfirm] = React.useState<null | "publish" | "discard">(null);
  const dirty = JSON.stringify(value) !== savedJson;

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(quiet = false): Promise<boolean> {
    const snapshot = JSON.stringify(value);
    const res = await saveCmsDraft(spec.key, value);
    if (!res.ok) {
      toast.error("Not saved", { description: res.message });
      return false;
    }
    setSavedJson(snapshot);
    if (!quiet) toast.success(res.message);
    router.refresh();
    return true;
  }

  async function run(kind: "save" | "preview" | "publish" | "discard") {
    setBusy(kind);
    try {
      if (kind === "save") await save();
      if (kind === "preview") {
        // Open the tab now: browsers block windows opened after an await.
        const tab = window.open("about:blank", "_blank");
        if (dirty && !(await save(true))) {
          tab?.close();
          return;
        }
        const url = `/portal/site/preview?path=${encodeURIComponent(spec.previewPath)}`;
        if (tab) tab.location.href = url;
        // The preview route sets cookies, so it needs a full page load rather than a client navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        else window.location.href = url;
      }
      if (kind === "publish") {
        if ((dirty || !status.hasDraft) && !(await save(true))) return;
        const res = await publishCms(spec.key);
        if (!res.ok) return void toast.error("Not published", { description: res.message });
        toast.success(res.message);
        router.refresh();
      }
      if (kind === "discard") {
        const res = await discardCmsDraft(spec.key);
        if (!res.ok) return void toast.error("That didn't work", { description: res.message });
        toast.success(res.message);
        // Reload so the editor shows what is live again.
        window.location.reload();
      }
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  const statusLine = dirty
    ? { tone: "warning", text: "Unsaved changes" }
    : status.hasDraft
      ? { tone: "info", text: `Draft saved ${when(status.draftUpdatedAt)}${status.draftUpdatedBy ? ` by ${status.draftUpdatedBy}` : ""}. Not live yet.` }
      : status.isPublished
        ? { tone: "success", text: `Live. Published ${when(status.publishedAt)}${status.publishedBy ? ` by ${status.publishedBy}` : ""}.` }
        : { tone: "neutral", text: "Showing the website's original content. Nothing has been published from here yet." };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        {/* Action bar */}
        <div className="sticky top-16 z-20 -mx-1 rounded-2xl border bg-background/95 p-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto flex min-w-0 items-center gap-2 text-sm font-semibold" suppressHydrationWarning>
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  statusLine.tone === "warning" && "bg-gold",
                  statusLine.tone === "info" && "bg-info",
                  statusLine.tone === "success" && "bg-success",
                  statusLine.tone === "neutral" && "bg-muted-foreground",
                )}
              />
              {statusLine.text}
            </p>
            {status.hasDraft && !dirty ? (
              <Button type="button" variant="ghost" size="sm" className="font-bold" disabled={busy !== null} onClick={() => setConfirm("discard")}>
                <UndoIcon />
                Discard draft
              </Button>
            ) : null}
            {dirty ? (
              <Button type="button" variant="ghost" size="sm" className="font-bold" disabled={busy !== null} onClick={() => setValue(JSON.parse(savedJson))}>
                <RotateCcwIcon />
                Undo changes
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" className="font-bold" disabled={busy !== null || !dirty} onClick={() => run("save")}>
              {busy === "save" ? <Spinner /> : <SaveIcon />}
              Save draft
            </Button>
            <Button type="button" variant="outline" size="sm" className="font-bold" disabled={busy !== null} onClick={() => run("preview")}>
              {busy === "preview" ? <Spinner /> : <EyeIcon />}
              Preview
            </Button>
            <Button
              type="button"
              size="sm"
              className="font-bold"
              disabled={busy !== null || (!dirty && !status.hasDraft && status.isPublished)}
              onClick={() => setConfirm("publish")}
            >
              {busy === "publish" ? <Spinner /> : <RocketIcon />}
              Publish
            </Button>
          </div>
        </div>

        {spec.sections.map((section, i) => (
          <SectionCard key={section.path ?? section.title} section={section} value={value} onChange={setValue} defaultOpen={i === 0} />
        ))}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Card className="gap-0 p-4">
          <h2 className="font-heading text-sm font-extrabold">Placeholders</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Type these in any text and they are filled in from Identity & contact.</p>
          <ul className="mt-3 space-y-1.5 text-xs">
            {CMS_TOKENS.map((t) => (
              <li key={t.token} className="flex items-center justify-between gap-2">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono font-bold">{t.token}</code>
                <span className="text-muted-foreground">{t.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-0 p-4">
          <h2 className="flex items-center gap-2 font-heading text-sm font-extrabold">
            <HistoryIcon className="size-4" />
            Published versions
          </h2>
          {status.versions.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Each time you publish, the version is kept here so you can go back to it.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {status.versions.map((ver, i) => (
                <li key={ver.id} className="flex items-start justify-between gap-2 text-xs">
                  <span className="min-w-0" suppressHydrationWarning>
                    <span className="block font-bold">
                      {when(ver.publishedAt)}
                      {i === 0 && status.isPublished ? <span className="ml-1.5 font-semibold text-success">Live</span> : null}
                    </span>
                    <span className="block text-muted-foreground">{ver.publishedBy}</span>
                    {ver.note ? <span className="block text-muted-foreground">Restored from an earlier version</span> : null}
                  </span>
                  {i > 0 ? (
                    <ConfirmAction
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0 px-2 text-xs font-bold"
                      pendingText="Restoring…"
                      confirm={{
                        title: "Restore this version?",
                        description: status.hasDraft || dirty
                          ? "It goes live straight away. Your unpublished draft is kept, so publishing it later will replace this version."
                          : "It goes live straight away. You can restore the current version again from this list.",
                        confirmLabel: "Restore",
                      }}
                      action={async () => {
                        const res = await restoreCmsVersion(ver.id);
                        if (res.ok && !status.hasDraft && !dirty) setTimeout(() => window.location.reload(), 400);
                        return res;
                      }}
                    >
                      Restore
                    </ConfirmAction>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>

      <AlertDialog open={confirm !== null} onOpenChange={(next) => !next && busy === null && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "publish" ? `Publish the ${spec.title.toLowerCase()}?` : "Discard your draft?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "publish"
                ? "Your changes go live on the website straight away. The current version is kept in the history."
                : "Your unpublished changes are deleted and the editor goes back to what is live."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy !== null}
              variant={confirm === "discard" ? "destructive" : "default"}
              onClick={() => confirm && run(confirm)}
            >
              {busy ? <Spinner /> : null}
              {confirm === "publish" ? "Publish" : "Discard draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
