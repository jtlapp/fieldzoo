import type { Handle } from "@sveltejs/kit";

import { createLucia } from "$lib/server/lucia";
import { DatabaseRepos } from "$lib/server/database-repos";

const databaseRepos = new DatabaseRepos();
const lucia = createLucia(databaseRepos.connectionPool);

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.lucia = lucia;
  event.locals.auth = lucia.handleRequest(event);
  event.locals.repos = databaseRepos;
  return await resolve(event);
};
