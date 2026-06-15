import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { extractTextFromPdfPath } from '../src/services/pdfService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outDir = outIndex >= 0 ? args[outIndex + 1] : null;
const fileArgs = args.filter((arg, index) => arg !== '--out' && index !== outIndex + 1);

if (fileArgs.length === 0) {
  console.error('Usage: tsx scripts/extractPdfText.ts <pdf...> [--out <dir>]');
  process.exit(1);
}

async function main() {
  if (outDir) {
    await mkdir(outDir, { recursive: true });
  }

  for (const filePath of fileArgs) {
    const text = await extractTextFromPdfPath(filePath);
    if (outDir) {
      const outPath = path.join(
        outDir,
        `${path.basename(filePath, path.extname(filePath))}.txt`
      );
      await writeFile(outPath, text, 'utf8');
      console.log(`Wrote ${outPath}`);
    } else {
      console.log(`\n===== ${filePath} =====\n`);
      console.log(text);
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Extraction failed: ${message}`);
  process.exit(1);
});
