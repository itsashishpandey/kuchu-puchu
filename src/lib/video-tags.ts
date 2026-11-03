// Saving a video's languages + category tags (upload, creator edit, admin correction).
// Always: validated server-side, written in one transaction, audit-logged. Never touches the
// content ID, view events, earnings or upload reward (spec §4, §15).
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Taxonomy } from "@/lib/discovery/types";
import { validateVideoTags, type TagInput, type ValidTags, type TagError } from "@/lib/discovery/tag-validation";
import { languageMismatch, suggestCategories } from "@/lib/discovery/suggest";

/** Accepts JSON strings (multipart uploads) or objects (JSON bodies). */
export function parseTagInput(src: { languages?: unknown; tags?: unknown }): TagInput {
  const parse = (v: unknown) => {
    if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } }
    return v ?? null;
  };
  const langs = parse(src.languages) as { primary?: string; additional?: string[] } | null;
  const tags = parse(src.tags) as { categoryId?: string; subcategoryId?: string }[] | null;
  return {
    primaryLanguage: langs?.primary ?? null,
    additionalLanguages: Array.isArray(langs?.additional) ? langs!.additional : [],
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
  };
}

export function firstError(errors: TagError[]): string {
  return errors[0]?.message ?? "Please check the language and categories.";
}

/** Review status for creator-chosen tags: flag likely-misleading language or category tags. */
export function reviewFor(text: string, value: ValidTags, taxonomy: Taxonomy): { status: "OK" | "NEEDS_REVIEW"; reason: string | null } {
  const lang = languageMismatch(text, value.languages.map(l => l.code), taxonomy);
  if (lang) return { status: "NEEDS_REVIEW", reason: lang };
  const sugg = suggestCategories(text, taxonomy, 3);
  const strong = sugg.filter(s => s.score >= 6);
  if (strong.length && !value.tags.some(t => strong.some(s => s.categoryId === t.categoryId))) {
    return { status: "NEEDS_REVIEW", reason: `Categories may not match the title — it looks like ${strong[0].categoryName}.` };
  }
  return { status: "OK", reason: null };
}

export async function snapshotTags(tx: Prisma.TransactionClient, videoId: string) {
  const [langs, tags] = await Promise.all([
    tx.videoLanguage.findMany({ where: { videoId }, orderBy: { position: "asc" }, include: { language: { select: { code: true } } } }),
    tx.videoCategoryAssignment.findMany({ where: { videoId }, orderBy: { priority: "asc" } }),
  ]);
  return {
    languages: langs.map(l => l.language.code),
    tags: tags.map(t => ({ priority: t.priority, categoryId: t.categoryId, subcategoryId: t.subcategoryId, source: t.source })),
  };
}

/**
 * Replace a video's tags. Runs inside `tx` (the caller's transaction) so the 3-category limit,
 * the parent-category rule (DB trigger) and the audit row commit or fail together.
 */
export async function writeVideoTags(
  tx: Prisma.TransactionClient,
  opts: {
    videoId: string; contentId: string; value: ValidTags; source: "CREATOR" | "ADMIN" | "BACKFILL";
    actor: { id: string; email: string }; taxonomy: Taxonomy; reviewStatus?: { status: string; reason: string | null };
    auditAction: string;
  },
) {
  const before = await snapshotTags(tx, opts.videoId);
  await tx.videoCategoryAssignment.deleteMany({ where: { videoId: opts.videoId } });
  await tx.videoLanguage.deleteMany({ where: { videoId: opts.videoId } });
  for (const t of opts.value.tags) {
    await tx.videoCategoryAssignment.create({
      data: {
        videoId: opts.videoId, categoryId: t.categoryId, subcategoryId: t.subcategoryId, priority: t.priority,
        source: opts.source, assignedById: opts.actor.id, updatedById: opts.actor.id,
      },
    });
  }
  for (const l of opts.value.languages) {
    await tx.videoLanguage.create({
      data: { videoId: opts.videoId, languageId: l.languageId, position: l.position, isPrimary: l.isPrimary, source: opts.source },
    });
  }
  const primary = opts.value.tags[0];
  const primarySub = opts.taxonomy.categories.find(c => c.id === primary.categoryId)?.subcategories.find(s => s.id === primary.subcategoryId);
  await tx.video.update({
    where: { id: opts.videoId },
    data: {
      category: primarySub?.nameEn ?? "Uncategorized", // legacy display label = primary subcategory
      tagsUpdatedAt: new Date(),
      ...(opts.reviewStatus ? { tagStatus: opts.reviewStatus.status, tagFlagReason: opts.reviewStatus.reason } : {}),
    },
  });
  await tx.taxonomyAuditLog.create({
    data: {
      actorId: opts.actor.id, actorEmail: opts.actor.email, action: opts.auditAction, entityType: "VIDEO_TAGS",
      entityId: opts.contentId, before: JSON.stringify(before),
      after: JSON.stringify({
        languages: opts.value.languages.map(l => l.code),
        tags: opts.value.tags.map(t => ({ priority: t.priority, categoryId: t.categoryId, subcategoryId: t.subcategoryId })),
        review: opts.reviewStatus ?? null,
      }),
    },
  });
}

export { validateVideoTags };
export type { TagInput, ValidTags };

/** Convenience for routes: validate + write in a fresh transaction. */
export async function saveVideoTags(opts: Omit<Parameters<typeof writeVideoTags>[1], "value"> & { input: TagInput; keepIds?: Set<string> }) {
  const res = validateVideoTags(opts.input, opts.taxonomy, { keepIds: opts.keepIds });
  if (!res.ok) return { ok: false as const, error: firstError(res.errors), errors: res.errors };
  await db.$transaction(tx => writeVideoTags(tx, { ...opts, value: res.value }));
  return { ok: true as const, value: res.value };
}
