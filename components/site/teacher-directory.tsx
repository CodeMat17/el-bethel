"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DirectoryTeacher {
  id: string;
  name: string;
  position: string;
  department: string;
  subjects: string[];
  experienceYears: number;
  qualifications: string[];
  bio: string;
  avatarSeed: string;
}

const TONES = ["navy", "gold", "info", "success", "plum"];

export function TeacherDirectory({ teachers }: { teachers: DirectoryTeacher[] }) {
  const [query, setQuery] = React.useState("");
  const [department, setDepartment] = React.useState("all");

  const departments = React.useMemo(
    () => ["all", ...Array.from(new Set(teachers.map((t) => t.department))).sort()],
    [teachers],
  );

  const filtered = teachers.filter((t) => {
    if (department !== "all" && t.department !== department) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${t.name} ${t.position} ${t.subjects.join(" ")}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role or subject"
            aria-label="Search teachers"
            className="h-11 pl-9"
          />
        </div>
        <Select value={department} onValueChange={(value) => setDepartment(String(value))}>
          <SelectTrigger className="h-11 w-full sm:w-64" aria-label="Filter by department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept === "all" ? "All departments" : dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-bold text-foreground">{filtered.length}</span> of {teachers.length} staff
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon="Search"
          title="No staff match your search"
          description="Try a different name, role or department."
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((teacher, i) => (
            <Card key={teacher.id} className="h-full gap-0 overflow-hidden p-0">
              <ToneImage
                tone={TONES[i % TONES.length]}
                seed={teacher.avatarSeed}
                kind="portrait"
                label={teacher.name}
                className="aspect-4/3"
              />
              <CardContent className="p-5">
                <h3 className="font-heading text-base font-extrabold">{teacher.name}</h3>
                <p className="mt-0.5 text-sm font-semibold text-gold-foreground dark:text-gold">
                  {teacher.position}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {teacher.bio}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="font-bold">{teacher.department}</Badge>
                  <Badge variant="secondary" className="font-bold">{teacher.experienceYears} yrs</Badge>
                  {teacher.subjects.slice(0, 2).map((s) => (
                    <Badge key={s} variant="secondary" className="font-bold">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
