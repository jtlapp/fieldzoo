import { error } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";

import type { RequestHandler } from "./$types";

export const GET = (async ({ locals }) => {
  const session = await locals.auth.validate();
  if (!session) {
    throw error(StatusCodes.UNAUTHORIZED, "not logged in");
  }
  await locals.lucia.invalidateSession(session.sessionId);
  locals.auth.setSession(null); // remove cookie
  return new Response(null, { status: StatusCodes.NO_CONTENT });
}) satisfies RequestHandler;
