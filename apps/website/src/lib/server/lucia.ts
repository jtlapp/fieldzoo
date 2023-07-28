// src/lib/server/lucia.ts
import { lucia } from "lucia";
import "lucia/polyfill/node"; // for Node.js <= 18
import { sveltekit } from "lucia/middleware";
import pg from "pg";
const { Pool } = pg;
import { pg as pgAdapter } from "@lucia-auth/adapter-postgresql";

import { PostgresConfig } from "@fieldzoo/env-config";

import { dev } from "$app/environment";

const pgConfig = new PostgresConfig();

export const auth = lucia({
  env: dev ? "DEV" : "PROD",
  middleware: sveltekit(),
  adapter: pgAdapter(
    new Pool({
      connectionString: pgConfig.getConnectionUrl(),
    }),
    {
      user: "users",
      key: "user_keys",
      session: "user_sessions",
    }
  ),

  getUserAttributes: (row) => {
    return {
      name: row.name,
      userHandle: row.userHandle,
      isDisabled: row.disabledAt !== null,
    };
  },
});

export type Auth = typeof auth;
