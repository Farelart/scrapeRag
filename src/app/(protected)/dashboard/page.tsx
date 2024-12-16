"use client";

import { useUser } from "@clerk/nextjs";
import { ExternalLink, Github } from "lucide-react";
import useProject from "~/hooks/use-project";
import Link from "next/link";
import CommitLog from "./commit-log";
import AskQuestionCard from "./ask-question-card";

export default function DashboardPage() {
  const user = useUser();
  const { project } = useProject();

  if (!user || !project) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-y-4">
        {/* github link */}
        <div className="w-fit rounded-md bg-primary px-4 py-3">
          <div className="flex items-center">
            <Github className="size-5 text-white" />
            <div className="ml-2">
              <p className="text-sm font-medium text-white">
                This project is linked to{""}
                <Link
                  href={project?.githubUrl ?? ""}
                  className="inline-flex items-center text-white/80 hover:underline"
                  target="_blank"
                >
                  {project?.githubUrl}
                  <ExternalLink className="size4 ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="h-4"></div>
        <div className="flex items-center gap-4">
          {/* <TeamMembers></TeamMembers>
          <InviteButton></InviteButton>
          <ArchiveButon></ArchiveButon> */}
        </div>
      </div>
      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <AskQuestionCard></AskQuestionCard>
          {/* <MeetingCard></MeetingCard> */} 
        </div>
      </div>
      <div className="mt-8"></div>
      <CommitLog></CommitLog>
    </div>
  );
}
