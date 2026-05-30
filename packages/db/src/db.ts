import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Single connection pool shared across the process lifetime.
// In serverless/edge environments, swap to @neondatabase/serverless + drizzle-orm/neon-http.
const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });
