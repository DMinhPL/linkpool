import { Worker } from "bullmq";
import {
  BACKGROUND_QUEUE,
  enqueueRssPolling,
  redisConnection,
} from "@linkwarden/lib/backgroundJobs";
import { prisma } from "@linkwarden/prisma";
import { autoTagPreservedLinks } from "./workers/autoTagPreservedLinks";
import { startIndexing } from "./workers/linkIndexing";
import { linkProcessing } from "./workers/linkProcessing";
import { migrationWorker } from "./workers/migrationWorker";
import { startRSSPolling } from "./workers/rssPolling";

const rssIntervalMs =
  (Number(process.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES) || 60) *
  60_000;
const rssEnabled = process.env.RSS_ENABLED === "true";

async function processJob(name: string) {
  try {
    switch (name) {
      case "process-links":
        await linkProcessing(0, true);
        // await startIndexing(0, true);
        await autoTagPreservedLinks(0, true);
        return;
      case "poll-rss":
        await startRSSPolling(true);
        return;
      default:
        throw new Error(`Unknown background job: ${name}`);
    }
  } finally {
    // Do not leave a cloud-Postgres connection open while this worker blocks
    // on Redis for the next user-triggered job.
    await prisma.$disconnect();
  }
}

async function init() {
  await migrationWorker();
  await prisma.$disconnect();

  const worker = new Worker(BACKGROUND_QUEUE, (job) => processJob(job.name), {
    connection: redisConnection,
    concurrency: 1,
  });

  worker.on("failed", (job, error) => {
    console.error(`Background job ${job?.name ?? "unknown"} failed:`, error);
  });

  if (rssEnabled) {
    // RSS is intentionally the sole time-based database task. The worker stays
    // blocked on Redis between runs and does not poll Postgres.
    await enqueueRssPolling();
    setInterval(() => {
      enqueueRssPolling().catch((error) =>
        console.error("Failed to enqueue RSS polling:", error)
      );
    }, rssIntervalMs);
  } else {
    console.log("RSS polling is disabled.");
  }

  console.log("\x1b[34m%s\x1b[0m", "Background queue worker is ready.");
}

process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit());

init().catch((error) => {
  console.error("Failed to initialize background worker:", error);
  process.exit(1);
});
