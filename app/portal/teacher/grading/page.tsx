import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { GradeDialog } from "@/components/portal/grade-dialog";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { avatarTone, formatDateTime, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Marking" };

export default async function TeacherGradingPage() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const [queue, dir] = await Promise.all([
    query(api.assignments.pendingForTeacher, {}),
    getDirectory(),
  ]);
  const assignmentsInQueue = new Set(queue.map((q) => q.assignment.id)).size;

  return (
    <>
      <PortalPageHeader
        title="Marking queue"
        description="Submissions with written answers waiting for your marks, oldest first. Pupils and parents see the score as soon as you save."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Waiting to be marked" value={queue.length} icon="PenSquare" tone={queue.length > 0 ? "warning" : "success"} />
        <StatCard label="Assignments" value={assignmentsInQueue} icon="ClipboardList" tone="info" />
        <StatCard
          label="Oldest in queue"
          value={queue.length ? formatDateTime(queue[0].submission.submittedAt) : "—"}
          icon="Activity"
          tone="neutral"
        />
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon="ClipboardCheck"
          title="Nothing to mark"
          description="Every submission has been marked. Choice questions are marked automatically."
        />
      ) : (
        <ul className="space-y-3">
          {queue.map(({ submission, assignment, student }) => (
            <li key={submission.id}>
              <Card className="gap-0 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar className="size-11 shrink-0">
                    <AvatarFallback className={cn("text-xs font-bold", avatarTone(student.avatarSeed))}>
                      {initials(student.firstName, student.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{studentName(student)}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      <Link href={`/portal/teacher/assignments/${assignment.id}`} className="hover:underline">
                        {assignment.title}
                      </Link>{" "}
                      · {dir.className(assignment.classId)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-bold">
                        {dir.subjectName(assignment.subjectId)}
                      </Badge>
                      <span className="text-[0.68rem] text-muted-foreground">{formatDateTime(submission.submittedAt)}</span>
                    </div>
                  </div>
                  <StatusPill tone="info">Awaiting marking</StatusPill>
                  <GradeDialog
                    submissionId={submission.id}
                    studentName={studentName(student)}
                    assignmentTitle={assignment.title}
                    questions={assignment.questions}
                    answers={submission.answers}
                    currentFeedback={submission.feedback}
                    graded={false}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
