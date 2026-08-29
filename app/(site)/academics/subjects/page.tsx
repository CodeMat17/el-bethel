import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CLASS_LEVELS } from "@/lib/school/config";
import { getSubjects } from "@/lib/school/data";

export const metadata: Metadata = {
  title: "Subjects",
  description:
    "The full subject offering at El-Bethel International Academy — core and additional subjects from Primary 1 to Primary 6.",
  alternates: { canonical: "/academics/subjects" },
};

const SUBJECT_BLURB: Record<string, string> = {
  "sub-eng": "Reading, comprehension, grammar, composition and spoken English, with a termly reading challenge running alongside.",
  "sub-mth": "Number, measurement, geometry and data, taught with concrete materials before abstract notation.",
  "sub-bsc": "Living things, matter, energy and the environment, with weekly practicals from Primary 4.",
  "sub-sst": "Family, community, Nigeria and the wider world — geography, history and civics woven together.",
  "sub-civ": "Rights, responsibilities, national values and what it means to be a good citizen at school and at home.",
  "sub-cmp": "Computer literacy from Primary 1, block coding from Primary 3, robotics and internet safety from Primary 4.",
  "sub-qr": "Number patterns, logic puzzles and visual reasoning — the mathematics behind the mathematics.",
  "sub-vr": "Analogies, vocabulary relationships, sequences and comprehension under time.",
  "sub-fre": "Greetings, everyday vocabulary, songs and Francophone culture, taught conversationally.",
  "sub-crs": "Bible stories, values and moral reasoning for pupils of Christian families.",
  "sub-irs": "Qur'anic studies, values and moral reasoning for pupils of Muslim families.",
  "sub-art": "Drawing, painting, printmaking, modelling and craft, exhibited each term.",
  "sub-mus": "Voice, rhythm, recorder and percussion, plus the school choir.",
  "sub-phe": "Movement, games, athletics, health education and personal hygiene.",
  "sub-hec": "Home management, nutrition, basic sewing and food safety.",
  "sub-agr": "Plants, soil, crops and animal care, with a working school garden.",
  "sub-lit": "Phonics, rhymes, storytelling and pre-writing skills for our youngest learners.",
  "sub-num": "Counting, sorting, patterns and shape through play and manipulatives.",
};

export default function SubjectsPage() {
  const subjects = getSubjects();
  const core = subjects.filter((s) => s.group === "core");
  const additional = subjects.filter((s) => s.group === "additional");

  const renderGroup = (list: typeof subjects) => (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((subject, i) => {
        const levels = CLASS_LEVELS.filter((l) => subject.levelIds.includes(l.id));
        return (
          <Reveal key={subject.id} delay={i * 0.03}>
            <Card className="h-full gap-0 p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-base font-extrabold">{subject.name}</h3>
                <Badge variant="secondary" className="shrink-0 font-mono font-bold">{subject.code}</Badge>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {SUBJECT_BLURB[subject.id]}
              </p>
              <p className="mt-4 text-xs font-semibold text-muted-foreground">
                {levels.length === CLASS_LEVELS.length
                  ? "Primary 1 – Primary 6"
                  : `${levels[0]?.name} – ${levels[levels.length - 1]?.name}`}
              </p>
            </Card>
          </Reveal>
        );
      })}
    </div>
  );

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Subjects"
        lede={`${subjects.length} subjects across core and additional strands. Administrators can add, retire or re-scope any subject from the admin dashboard.`}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Academics", href: "/academics" },
          { label: "Subjects", href: "/academics/subjects" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Core subjects"
            title="Taught to every pupil, every week"
            lede="These carry the greatest weight in continuous assessment and on the report card."
          />
          {renderGroup(core)}
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Additional subjects"
            title="Breadth, taught seriously"
            lede="Additional does not mean optional. Every one of these appears on the timetable and the report card."
          />
          {renderGroup(additional)}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
