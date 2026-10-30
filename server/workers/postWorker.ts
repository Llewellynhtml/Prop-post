import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import db from '../config/db.js';

export const publishPost = async (postId: number) => {
  const post = db.prepare("SELECT * FROM scheduled_posts WHERE id = ?").get(postId) as any;
  if (!post) {
    console.warn(`[Publish] Post ${postId} not found in database, skipping.`);
    return;
  }

  try {
    // Publishing integrations are not connected. Never mark unsubmitted posts as posted.
    const errorMessage = "Automatic publishing is not configured; no post was sent.";
    db.prepare(`
      UPDATE scheduled_posts
      SET publish_status = 'not_configured', failure_reason = ?,
          attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(errorMessage, postId);
    console.warn(`[Publish] Post ${postId} skipped: ${errorMessage}`);
    return;
  } catch (error: any) {
    console.error(`[Publish] Failed to publish post ${postId}: ${error.message}`);
    
    db.prepare(`
      UPDATE scheduled_posts 
      SET status = 'failed', 
          publish_status = 'error',
          failure_reason = ?,
          attempts = attempts + 1,
          last_attempt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(error.message, postId);

    throw error;
  }
};

export const initPostWorker = () => {
  if (!process.env.REDIS_URL) {
    console.log("[Worker] REDIS_URL not found. BullMQ worker disabled.");
    return null;
  }

  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    connectTimeout: 5000,
  }) as any;

  connection.on('error', (err: any) => {
    console.warn('[Worker Redis] Connection failed:', err.message);
  });

  const worker = new Worker('post-publishing', async (job: Job) => {
    const { postId } = job.data;
    console.log(`[Worker] Processing job ${job.id} for post ${postId}`);
    await publishPost(postId);
  }, { 
    connection,
    concurrency: 5
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
};
