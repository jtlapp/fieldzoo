import type { LayoutServerLoad } from "./$types";

export const load = (async ({ locals }) => {
  // TODO: compact this
  const result = { session: await locals.auth.validate() };
  console.log("**** layout load session", result.session);
  return result;
}) satisfies LayoutServerLoad;
