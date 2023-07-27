import { auth } from "$lib/server/lucia.js";
import { error } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";

import type { RequestHandler } from "./$types";

export const GET = (async ({ locals }) => {
  console.log("**** GET logout");
  const session = await locals.auth.validate();
  if (!session) {
    throw error(StatusCodes.UNAUTHORIZED, "not logged in");
  }
  await auth.invalidateSession(session.sessionId);
  locals.auth.setSession(null); // remove cookie
  return new Response(null, { status: StatusCodes.NO_CONTENT });
}) satisfies RequestHandler;
