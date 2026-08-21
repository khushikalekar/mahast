/**
 * DB initialization middleware — runs before all API routes.
 * Uses a module-level singleton to avoid re-running on every request.
 */
import { initializeDatabase } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { bootstrapGPS } from "@/lib/gps-provider";

let ready = false;
let readyPromise: Promise<void> | null = null;

export async function ensureReady() {
  if (ready) return;
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await initializeDatabase();
    await seedDatabase();
    await bootstrapGPS();
    ready = true;
  })();
  return readyPromise;
}
