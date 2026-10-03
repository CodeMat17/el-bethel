"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LinkIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { findParents, findStudents, linkGuardian } from "@/lib/school/actions/admin";

type Found = { id: string; title: string; detail: string };

/** Search-and-pick dialog used to link a parent to a pupil (either direction). */
function LinkDialog({
  label,
  title,
  description,
  search,
  link,
  exclude,
}: {
  label: string;
  title: string;
  description: string;
  search: (term: string) => Promise<Found[]>;
  link: (id: string) => Promise<{ ok: boolean; message?: string }>;
  exclude: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<Found[]>([]);
  const [searching, startSearch] = React.useTransition();
  const [linking, setLinking] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      startSearch(async () => setResults((await search(term)).filter((r) => !exclude.includes(r.id))));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [term, open, search, exclude]);

  async function choose(id: string) {
    setLinking(id);
    try {
      const res = await link(id);
      if (!res.ok) {
        toast.error("Couldn't link", { description: res.message });
        return;
      }
      toast.success(res.message ?? "Linked");
      setOpen(false);
      router.refresh();
    } finally {
      setLinking(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => linking === null && setOpen(next)}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="font-bold" />}>
        <LinkIcon />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by name, email or phone" className="h-11 pl-9" autoFocus />
          {searching ? <Spinner className="absolute top-1/2 right-3 -translate-y-1/2" /> : null}
        </div>
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {results.length === 0 && !searching ? <li className="py-6 text-center text-sm text-muted-foreground">No matches.</li> : null}
          {results.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.detail}</p>
              </div>
              <Button size="sm" className="font-bold" disabled={linking !== null} onClick={() => choose(r.id)}>
                {linking === r.id ? <Spinner /> : <LinkIcon />}
                {linking === r.id ? "Linking…" : "Link"}
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function LinkParentDialog({ studentId, linkedParentIds }: { studentId: string; linkedParentIds: string[] }) {
  const search = React.useCallback(
    async (term: string) => (await findParents(term)).map((p) => ({ id: p.id, title: p.name, detail: [p.email, p.phone].filter(Boolean).join(" · ") })),
    [],
  );
  const link = React.useCallback((parentId: string) => linkGuardian(studentId, parentId, true), [studentId]);
  return (
    <LinkDialog
      label="Link existing parent"
      title="Link a parent or guardian"
      description="Find a parent already on record. To add someone new, use Add parent."
      search={search}
      link={link}
      exclude={linkedParentIds}
    />
  );
}

export function LinkChildDialog({ parentId, linkedStudentIds, classNames }: { parentId: string; linkedStudentIds: string[]; classNames: Record<string, string> }) {
  const search = React.useCallback(
    async (term: string) =>
      (await findStudents(term)).map((s) => ({ id: s.id, title: s.name, detail: `${classNames[s.classId] ?? ""} · ${s.studentNo}` })),
    [classNames],
  );
  const link = React.useCallback((studentId: string) => linkGuardian(studentId, parentId, true), [parentId]);
  return (
    <LinkDialog
      label="Link a child"
      title="Link a pupil to this parent"
      description="Find the pupil by name or student number."
      search={search}
      link={link}
      exclude={linkedStudentIds}
    />
  );
}
