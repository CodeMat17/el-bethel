import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { TeacherDirectory, type DirectoryTeacher } from "@/components/site/teacher-directory";
import { getSubject, getTeachers, teacherName } from "@/lib/school/data";

export const metadata: Metadata = {
  title: "Our Teachers",
  description:
    "Meet the 34 teaching staff at El-Bethel International Academy, Abuja — their subjects, qualifications and experience.",
  alternates: { canonical: "/about/teachers" },
};

export default function TeachersPage() {
  const teachers: DirectoryTeacher[] = getTeachers()
    .filter((t) => t.active)
    .map((t) => ({
      id: t.id,
      name: teacherName(t),
      position: t.position,
      department: t.department,
      subjects: t.subjectIds.map((id) => getSubject(id)?.name ?? "").filter(Boolean),
      experienceYears: t.experienceYears,
      qualifications: t.qualifications,
      bio: t.bio,
      avatarSeed: t.avatarSeed,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Our Teachers"
        lede="Forty-two teaching staff trained in the academic, emotional and developmental needs of children — and the people who will know your child by name."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Our Teachers", href: "/about/teachers" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Staff directory"
            title="Find a teacher"
            lede="Search by name, role or subject, or filter by department."
            className="mb-10"
          />
          <TeacherDirectory teachers={teachers} />
        </div>
      </section>

      <CtaBand
        title="Want to join our teaching community?"
        text="We recruit teachers who are rigorous about learning and warm with children — in that combination."
        primary={{ label: "See open vacancies", href: "/careers" }}
        secondary={{ label: "Contact the school", href: "/contact" }}
      />
    </>
  );
}
