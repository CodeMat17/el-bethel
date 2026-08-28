import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requireTeacher } from "@/lib/school/auth";
import { classDisplayName, classesForTeacher, getStudentsByClass, getSubject } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Quizzes" };

export default async function TeacherQuizzesPage() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const db = getDb();
  const myClassIds = new Set(classesForTeacher(user.teacherId).map((c) => c.id));
  // Quizzes for classes this teacher teaches — never the whole school's.
  const quizzes = db.quizzes.filter((q) => myClassIds.has(q.classId));

  const attemptsByQuiz = new Map<string, number>();
  for (const attempt of db.quizAttempts) {
    attemptsByQuiz.set(attempt.quizId, (attemptsByQuiz.get(attempt.quizId) ?? 0) + 1);
  }

  return (
    <>
      <PortalPageHeader
        title="Quizzes"
        description="Short auto-marked checks of understanding. Pupils see their score immediately."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Published quizzes" value={quizzes.filter((q) => q.status === "published").length} icon="Puzzle" tone="info" />
        <StatCard label="Questions written" value={quizzes.reduce((s, q) => s + q.questions.length, 0)} icon="ClipboardPen" tone="gold" />
        <StatCard label="Attempts recorded" value={db.quizAttempts.length} icon="Activity" tone="success" />
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon="Puzzle"
          title="No quizzes yet"
          description="Quizzes for your classes will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const roster = getStudentsByClass(quiz.classId).length;
            const attempts = attemptsByQuiz.get(quiz.id) ?? 0;
            const rate = roster ? Math.round((attempts / roster) * 100) : 0;
            return (
              <Card key={quiz.id} className="flex h-full flex-col gap-0 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-base font-extrabold">{quiz.title}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {classDisplayName(quiz.classId)} · {getSubject(quiz.subjectId)?.name}
                    </p>
                  </div>
                  <StatusPill tone={quiz.status === "published" ? "success" : "neutral"}>
                    {quiz.status}
                  </StatusPill>
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{quiz.description}</p>

                <Separator className="my-4" />

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-bold">{quiz.questions.length} questions</Badge>
                  <Badge variant="secondary" className="font-bold">{quiz.durationMinutes} minutes</Badge>
                  <Badge variant="secondary" className="font-bold">
                    {quiz.attemptsAllowed} attempt{quiz.attemptsAllowed === 1 ? "" : "s"}
                  </Badge>
                  {quiz.randomize ? <Badge variant="outline" className="font-bold">Randomised</Badge> : null}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs font-bold">
                    <span>Attempted</span>
                    <span className="tabular-nums text-muted-foreground">
                      {attempts} of {roster}
                    </span>
                  </div>
                  <Progress value={rate} className="mt-2" />
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Open {formatDate(quiz.opensAt)} — closes {formatDate(quiz.closesAt)}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="text-sm leading-relaxed">
          <span className="font-extrabold">Quiz authoring · </span>
          Multiple choice, true/false and short answer questions are auto-marked by the server. Matching
          and picture questions are supported by the data model and are being added to the authoring
          interface.
        </p>
      </Card>
    </>
  );
}
