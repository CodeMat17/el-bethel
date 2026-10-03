import type { Metadata } from "next";
import { BookOpenIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading, StatusPill } from "@/components/common";
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
import { getPublicCatalogue, verifyCertificate } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "School Library",
  description:
    "The El-Bethel International Academy library — catalogue, borrowing, guided reading and the termly reading challenge.",
  alternates: { canonical: "/school-life/library" },
};

const PROGRAMMES = [
  { title: "Guided reading", text: "Small-group reading with a teacher, matched to each child's current level, twice a week." },
  { title: "Reading challenge", text: "Twenty books a term earns a place at our celebration assembly. Every pupil gets a reading passport." },
  { title: "Story sessions", text: "Weekly story time for lower primary, often with a guest reader." },
  { title: "Borrowing", text: "Pupils from Primary 1 may borrow one book at a time for two weeks, renewable once." },
];

export default async function LibraryPage() {
  const books = (await getPublicCatalogue()).books;
  const totalCopies = books.reduce((s, b) => s + b.copiesTotal, 0);
  const available = books.reduce((s, b) => s + b.copiesAvailable, 0);

  return (
    <>
      <PageHero
        eyebrow="School life"
        title="School Library"
        lede="Age-appropriate books, quiet reading corners and a guided reading programme designed to build a lifelong habit."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Library", href: "/school-life/library" },
        ]}
      >
        <div className="flex flex-wrap gap-6 text-sm text-navy-foreground/80">
          <span><span className="font-heading text-xl font-extrabold text-gold">{books.length}</span> titles catalogued</span>
          <span><span className="font-heading text-xl font-extrabold text-gold">{totalCopies}</span> copies</span>
          <span><span className="font-heading text-xl font-extrabold text-gold">{available}</span> available today</span>
        </div>
      </PageHero>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Programmes" title="How reading works here" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMMES.map((programme, i) => (
              <Reveal key={programme.title} delay={i * 0.05}>
                <Card className="h-full gap-0 p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                    <BookOpenIcon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{programme.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{programme.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Catalogue"
            title="A sample of what is on the shelves"
            lede="Pupils and parents can see borrowing history and current loans in the Pupil and Parent Portals."
          />
          <div className="mt-10 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Ages</TableHead>
                  <TableHead className="text-right">Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-bold">{book.title}</TableCell>
                    <TableCell className="text-muted-foreground">{book.author}</TableCell>
                    <TableCell className="text-muted-foreground">{book.category}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{book.ageRange}</TableCell>
                    <TableCell className="text-right">
                      <StatusPill tone={book.copiesAvailable > 0 ? "success" : "warning"}>
                        {book.copiesAvailable > 0 ? `${book.copiesAvailable} of ${book.copiesTotal}` : "All on loan"}
                      </StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <CtaBand
        title="Reading is the single best predictor of later success"
        text="Fifteen minutes of reading together each evening changes a child's trajectory more than almost anything else a family can do."
        primary={{ label: "Apply for admission", href: "/admissions/apply" }}
        secondary={{ label: "See our academics", href: "/academics" }}
      />
    </>
  );
}
