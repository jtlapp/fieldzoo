// src/lib/server/lucia.ts
import { lucia } from "lucia";
import "lucia/polyfill/node"; // for Node.js <= 18
import { sveltekit } from "lucia/middleware";
import pg from "pg";
const { Pool } = pg;
import { pg as pgAdapter } from "@lucia-auth/adapter-postgresql";

import { dev } from "$app/environment";

export function createLucia(pool: InstanceType<typeof Pool>) {
  return lucia({
    env: dev ? "DEV" : "PROD",
    middleware: sveltekit(),
    adapter: pgAdapter(pool, {
      user: "users",
      key: "user_keys",
      session: "user_sessions",
    }),

    getUserAttributes: (row) => {
      return {
        email: row.email,
        emailVerified: row.emailVerified,
        displayName: row.displayName,
        userHandle: row.userHandle,
        isDisabled: row.disabledAt !== null,
      };
    },
  });
}

export type Lucia = ReturnType<typeof createLucia>;
