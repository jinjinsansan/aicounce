#!/usr/bin/env ts-node

import fs from "node:fs";
import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { insertRagDocument } from "@/lib/rag";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("file", {
      type: "string",
      describe: "Path to transcript text file",
      demandOption: true,
    })
    .option("counselorId", {
      type: "string",
      describe: "Target counselor ID",
      demandOption: true,
    })
    .option("title", {
      type: "string",
      describe: "Document title",
      default: "Imported transcript",
    })
    .option("sourceType", {
      type: "string",
      default: "manual",
    })
    .parse();

  const filePath = path.resolve(argv.file);
  const content = fs.readFileSync(filePath, "utf8");

  const docId = await insertRagDocument({
    counselorId: argv.counselorId,
    sourceType: argv.sourceType,
    sourceId: path.basename(filePath),
    title: argv.title,
    content,
  });

  console.log(`Document inserted: ${docId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
