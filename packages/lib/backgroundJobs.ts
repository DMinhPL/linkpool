import { Queue } from "bullmq";

export const BACKGROUND_QUEUE = "linkpool-background";

const redisUrl = new URL(process.env.REDIS_URL || "redis://redis:6379");

export const redisConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  ...(redisUrl.username ? { username: redisUrl.username } : {}),
  ...(redisUrl.password ? { password: redisUrl.password } : {}),
};

let queue: Queue | undefined;

const getQueue = () => {
  queue ??= new Queue(BACKGROUND_QUEUE, { connection: redisConnection });
  return queue;
};

/**
 * Each write receives a durable job. Extra jobs are cheap (they find no work)
 * and avoid losing a link created while another processing job is active.
 */
export async function enqueueLinkProcessing() {
  await getQueue().add(
    "process-links",
    {},
    {
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
}

export async function enqueueRssPolling() {
  await getQueue().add(
    "poll-rss",
    {},
    {
      jobId: "poll-rss",
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
}
