import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC = "/home/z/my-project/scripts/gen";
const OUT = "/home/z/my-project/public/images";

const jobs = [
  // avatars → 512x512 webp
  ...fs.readdirSync(SRC).filter(f => /^av\d+\.png$/.test(f)).map(f => ({
    in: path.join(SRC, f), out: path.join(OUT, "avatars", f.replace(".png", ".webp")),
    w: 512, h: 512,
  })),
  // thumbnails → 640x1120 (9:16) webp
  ...fs.readdirSync(SRC).filter(f => /^th\d+\.png$/.test(f)).map(f => ({
    in: path.join(SRC, f), out: path.join(OUT, "thumbs", f.replace(".png", ".webp")),
    w: 640, h: 1120,
  })),
  { in: path.join(SRC, "hero-creator.png"), out: path.join(OUT, "hero-creator.webp"), w: 720, h: 1260 },
  { in: path.join(SRC, "hero-wide.png"), out: path.join(OUT, "hero-wide.webp"), w: 1344, h: 672 },
  { in: path.join(SRC, "illus-earn.png"), out: path.join(OUT, "illus-earn.webp"), w: 900, h: 900 },
  { in: path.join(SRC, "illus-shield.png"), out: path.join(OUT, "illus-shield.webp"), w: 900, h: 900 },
  { in: path.join(SRC, "illus-phone.png"), out: path.join(OUT, "illus-phone.webp"), w: 900, h: 900 },
];

let total = 0;
for (const j of jobs) {
  fs.mkdirSync(path.dirname(j.out), { recursive: true });
  const buf = await sharp(j.in).resize(j.w, j.h, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
  fs.writeFileSync(j.out, buf);
  total += buf.length;
  console.log(`${path.basename(j.out)} ${(buf.length / 1024).toFixed(0)}KB`);
}
console.log(`DONE ${jobs.length} files, ${(total / 1024 / 1024).toFixed(1)}MB total`);
