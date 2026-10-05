// src/app/cases/[number]/page.tsx
// One story with votes and its comment thread.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/comment-form";
import { CommentThread } from "@/components/comment-thread";
import { InlineMarkdown, stripMarkdown } from "@/components/inline-markdown";
import { ShareButton } from "@/components/share-button";
import { VoteControl } from "@/components/vote-control";
import { cardClass } from "@/components/ui";
import { PUBLISHED_CASES, regionSlug } from "@/data/published-cases";
import { caseTarget, commentTree, statsFor } from "@/lib/discussion";
import { siteUrl } from "@/lib/site";
import { canSaveReports } from "@/lib/store";

function findCase(number: string) {
  return PUBLISHED_CASES.find((c) => String(c.number) === number) ?? null;
}

export async function generateMetadata(props: PageProps<"/cases/[number]">): Promise<Metadata> {
  const c = findCase((await props.params).number);
  if (!c) return { title: "Not found" };
  return { title: stripMarkdown(c.title), description: `“${c.words[0]}”` };
}

export default async function CasePage(props: PageProps<"/cases/[number]">) {
  const c = findCase((await props.params).number);
  if (!c) notFound();
  const target = caseTarget(c.number);
  const [stats, comments] = await Promise.all([statsFor([target]), commentTree(target)]);
  const s = stats[target];
  const enabled = canSaveReports();

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href={`/cases?region=${regionSlug(c.region)}`} className="text-sm text-muted hover:text-foreground">
        ← {c.region}
      </Link>
      <div className={`${cardClass} flex gap-3 p-3`}>
        <VoteControl target={target} initialScore={s.score} initialVote={s.myVote} enabled={enabled} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">
            <InlineMarkdown text={c.title} />
          </h1>
          {c.words.map((words, index) => (
            <blockquote key={index} className="mt-3 border-l-2 border-accent pl-3 leading-relaxed italic">
              “{words}”
            </blockquote>
          ))}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>💬 {s.comments} {s.comments === 1 ? "comment" : "comments"}</span>
            <ShareButton url={`${siteUrl()}/cases/${c.number}`} text={`“${c.words[0]}”`} />
          </div>
        </div>
      </div>

      <section id="comments" className="space-y-4 scroll-mt-4">
        <CommentForm target={target} enabled={enabled} />
        <CommentThread comments={comments} target={target} enabled={enabled} />
      </section>
    </article>
  );
}
