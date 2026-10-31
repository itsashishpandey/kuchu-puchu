/**
 * Recompute visual fingerprints for all videos (after algorithm change) and
 * verify duplicate-detection outcomes.
 */
import { PrismaClient } from "@prisma/client";
import { visualHash, audioHash, sha256Buffer, visualSimilarityFine } from "../src/lib/fingerprint";
import fs from "fs";

const db = new PrismaClient();

async function main() {
  const vids = await db.video.findMany({ select: { id: true, contentId: true, videoUrl: true, duration: true } });
  const hashes = new Map<string, string>();
  for (const v of vids) {
    const path = "/home/z/my-project/public" + v.videoUrl;
    if (!fs.existsSync(path)) { console.log("missing", path); continue; }
    const vh = await visualHash(path, v.duration);
    await db.video.update({ where: { id: v.id }, data: { visualHash: vh } });
    hashes.set(v.contentId, vh);
    console.log(v.contentId, vh);
  }

  // similarity matrix check
  const ids = [...hashes.keys()];
  let maxOffDiag = 0, pair = "";
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      // true duplicate pair: VID-2026-000001 is v12; 000004=v01; 000017=v01_dup; 000018=test upload
      const isTrueDup = (a === "VID-2026-000004" && b === "VID-2026-000017") || (b === "VID-2026-000004" && a === "VID-2026-000017");
      if (isTrueDup) continue;
      const s = visualSimilarityFine(hashes.get(a)!, hashes.get(b)!);
      if (s > maxOffDiag) { maxOffDiag = s; pair = `${a} vs ${b}`; }
    }
  }
  const trueDup = visualSimilarityFine(hashes.get("VID-2026-000004")!, hashes.get("VID-2026-000017")!);
  console.log(`\nTRUE duplicate similarity (v01 vs v01_dup): ${(trueDup * 100).toFixed(1)}%`);
  console.log(`HIGHEST unrelated similarity: ${(maxOffDiag * 100).toFixed(1)}% (${pair})`);
  console.log(`Threshold is 85% — ${maxOffDiag < 0.85 ? "✓ no false positives" : "✗ STILL false positives!"}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
