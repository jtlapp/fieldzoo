import type { LayoutServerLoad } from "./$types";

export const load = (async ({ locals }) => {
  return { session: await locals.auth.validate() };
}) satisfies LayoutServerLoad;
