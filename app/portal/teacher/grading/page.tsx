import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { GradeDialog } from "@/components/portal/grade-dialog";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireTeacher } from "@/lib/school/auth";
import {
  classDisplayName,
  getAssignment,
  getStudent,
  getSubject,
  pendingGradingForTeacher,
  studentName,
} from "@/lib/school/data";
import { avatarTone, fileSize, formatDateTime, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Grading" };

export default async function TeacherGradingPage() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const queue = pendingGradingForTeacher(user.teacherId);
  const late = queue.filter((s) => s.status === "late").length;

  return (
    <>
      <PortalPageHeader
        title="Grading queue"
        description="Every submission waiting for a mark, newest first. Grading notifies the pupil and their parents."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Waiting to be marked" value={queue.length} icon="PenSquare" tone={queue.length > 0 ? "warning" : "success"} />
        <StatCard label="Submitted late" value={late} icon="Clock" tone={late > 0 ? "danger" : "success"} />
        <StatCard
          label="Oldest in queue"
          value={queue.length ? formatDateTime(queue[queue.length - 1].submittedAt ?? "") : "—"}
          icon="Activity"
          tone="neutral"
        />
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon="ClipboardCheck"
          title="Nothing to mark"
          description="Every submission has been graded and returned. Well done."
        />
      ) : (
        <ul className="space-y-3">
          {queue.map((submission) => {
            const assignment = getAssignment(submission.assignmentId);
            const student = getStudent(submission.studentId);
            if (!assignment || !student) return null;
            return (
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
                        {assignment.title} · {classDisplayName(assignment.classId)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-bold">
                          {getSubject(assignment.subjectId)?.name}
                        </Badge>
                        <span className="text-[0.68rem] text-muted-foreground">
                          {submission.submittedAt ? formatDateTime(submission.submittedAt) : ""}
                        </span>
                      </div>
                    </div>
                    <StatusPill tone={submission.status === "late" ? "warning" : "info"}>
                      {submission.status === "late" ? "Late" : "Submitted"}
                    </StatusPill>
                    <GradeDialog
                      submissionId={submission.id}
                      studentName={studentName(student)}
                      assignmentTitle={assignment.title}
                      maxScore={assignment.maxScore}
                      currentScore={submission.score}
                      currentFeedback={submission.feedback}
                      textAnswer={submission.textAnswer}
                      files={submission.files.map((f) => ({
                        id: f.id,
                        name: f.name,
                        size: fileSize(f.sizeBytes),
                      }))}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
