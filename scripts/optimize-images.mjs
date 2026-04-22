import sharp from "sharp";
import fs from "fs";
import path from "path";

const IMG_DIR = path.resolve("public/img");
const MAX_WIDTH = 1200;
const QUALITY = 80;

const files = fs.readdirSync(IMG_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

for (const file of files) {
  const filePath = path.join(IMG_DIR, file);
  const stat = fs.statSync(filePath);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1);

  // Skip logo — it's already small
  if (file === "logo.png") {
    console.log(`SKIP  ${file} (${sizeMB}MB) — logo`);
    continue;
  }

  const tmpPath = filePath + ".tmp";
  const ext = path.extname(file).toLowerCase();

  try {
    let pipeline = sharp(filePath).resize({ width: MAX_WIDTH, withoutEnlargement: true });

    if (ext === ".jpg" || ext === ".jpeg") {
      pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
    } else if (ext === ".png") {
      pipeline = pipeline.png({ quality: QUALITY });
    }

    await pipeline.toFile(tmpPath);

    const newStat = fs.statSync(tmpPath);
    const newSizeMB = (newStat.size / 1024 / 1024).toFixed(1);

    // Replace original
    fs.unlinkSync(filePath);
    fs.renameSync(tmpPath, filePath);

    console.log(`OK    ${file}: ${sizeMB}MB → ${newSizeMB}MB`);
  } catch (err) {
    console.error(`FAIL  ${file}: ${err.message}`);
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

console.log("\nDone!");
