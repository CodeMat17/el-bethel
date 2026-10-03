import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ASSESSMENT_WEIGHTING, CONDUCT_TRAITS, GRADE_BANDS } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Assessment & Reports",
  description:
    "How El-Bethel International Academy assesses pupils: continuous assessment and examinations (typically 40/60, set by each subject teacher), and termly report cards.",
  alternates: { canonical: "/academics/assessment" },
};

const SAMPLE_RESULT = [
  { subject: "Mathematics", ca: 35, exam: 55 },
  { subject: "English Studies", ca: 32, exam: 50 },
  { subject: "Basic Science", ca: 30, exam: 48 },
  { subject: "Social Studies", ca: 34, exam: 50 },
  { subject: "Computer Studies", ca: 33, exam: 52 },
];

function gradeOf(total: number) {
  return GRADE_BANDS.find((b) => total >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

export default function AssessmentPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Assessment & Reports"
        lede="Assessment at El-Bethel is continuous. A child's term score reflects the whole term, not one difficult morning in December."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Academics", href: "/academics" },
          { label: "Assessment", href: "/academics/assessment" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Weighting"
              title="How a subject score is built"
              lede="Every subject score is out of 100. This is the usual split; each subject teacher sets the exact CA and exam weighting for the term."
            />
            <div className="mt-8 space-y-5">
              {ASSESSMENT_WEIGHTING.map((w) => (
                <div key={w.component}>
                  <div className="flex items-baseline justify-between text-sm font-bold">
                    <span>{w.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      typically {w.weight}%
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${w.weight}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Card className="mt-8 gap-0 border-gold/25 bg-gold/8 p-5">
              <p className="text-sm leading-relaxed">
                <span className="font-extrabold">Continuous assessment typically carries 40 percent.</span>{" "}
                Classwork, assignments and tests are recorded throughout the term, so a child who works
                steadily is rewarded for it. Report cards show what each score was marked out of.
              </p>
            </Card>
          </div>

          <div>
            <SectionHeading eyebrow="Grading" title="Grade bands and remarks" />
            <div className="mt-8 overflow-hidden rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Score range</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GRADE_BANDS.map((band, i) => (
                    <TableRow key={band.grade}>
                      <TableCell className="font-heading text-base font-extrabold">{band.grade}</TableCell>
                      <TableCell className="tabular-nums">
                        {band.min}
                        {i === 0 ? "–100" : `–${GRADE_BANDS[i - 1].min - 1}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{band.remark}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Sample result"
            title="What a term result looks like"
            lede="A worked example using a 40/60 split. Real results are visible only to a pupil's own family in the Parent and Pupil Portals."
          />
          <Reveal>
            <div className="mt-10 overflow-x-auto rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">CA (40)</TableHead>
                    <TableHead className="text-right">Exam (60)</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Grade</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SAMPLE_RESULT.map((row) => {
                    const total = row.ca + row.exam;
                    const band = gradeOf(total);
                    return (
                      <TableRow key={row.subject}>
                        <TableCell className="font-bold">{row.subject}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.ca}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.exam}</TableCell>
                        <TableCell className="text-right font-extrabold tabular-nums">{total}</TableCell>
                        <TableCell className="text-right font-extrabold">{band.grade}</TableCell>
                        <TableCell className="text-muted-foreground">{band.remark}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Report cards" title="What every report card contains" />
            <ul className="mt-8 grid gap-3">
              {[
                "Subject-by-subject continuous assessment and examination scores",
                "Total, average and grade for every subject",
                "Class position, where the school has enabled it",
                "Attendance for the term",
                "Conduct and character ratings",
                "A written comment from the class teacher",
                "A written comment from the Headteacher",
                "Promotion status at the end of the session",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Conduct" title="Character, rated and reported" lede="Seven traits rated by the class teacher on a five-point scale each term." />
            <div className="mt-8 flex flex-wrap gap-2.5">
              {CONDUCT_TRAITS.map((trait) => (
                <span key={trait} className="rounded-full border bg-card px-4 py-2 text-sm font-bold shadow-sm">
                  {trait}
                </span>
              ))}
            </div>
            <Card className="mt-8 gap-0 p-6">
              <h3 className="font-heading text-base font-extrabold">Publication and access</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Report cards are published to the Parent Portal on the result publication date at the end
                of each term, with a printable version available to download. Historical report cards are
                preserved permanently — promotion never overwrites a previous year&apos;s record.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
