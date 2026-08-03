export const SAMPLE_VULNERABLE_CODE = `/**
 * User & Analytics Service - Production Scale Audit Sample
 * This sample contains typical scale bottlenecks: N+1 queries, memory leaks, unindexed operations.
 */
import { Pool } from "pg";
import redis from "redis";

const pool = new Pool({ max: 20 });
const cache = redis.createClient();

export async function getUserDashboardData(userIds: string[]) {
  const users = [];

  // SCALE ISSUE 1: N+1 Query Pattern inside loop
  for (const id of userIds) {
    const client = await pool.connect();
    // SCALE ISSUE 2: Connection Pool Exhaustion (client not released in try/finally)
    const res = await client.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = res.rows[0];

    // SCALE ISSUE 3: Secondary N+1 query for user orders
    const ordersRes = await client.query("SELECT * FROM orders WHERE user_id = $1", [id]);
    user.orders = ordersRes.rows;

    // SCALE ISSUE 4: Unbounded in-memory sorting of large array
    user.orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    users.push(user);
  }

  return users;
}

// SCALE ISSUE 5: Unbounded Query without pagination or LIMIT
export async function getGlobalAuditLogs() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM audit_logs ORDER BY timestamp DESC");
    return res.rows;
  } finally {
    client.release();
  }
}

// SCALE ISSUE 6: Memory Leak via global event listener accumulator
const logBuffer: any[] = [];
export function trackEvent(event: any) {
  logBuffer.push({ ...event, timestamp: Date.now() });
  // Buffer grows indefinitely without flushing or max capacity limit
}
`;
