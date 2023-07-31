import { redirect } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) {
    if (!session.user.emailVerified)
      throw redirect(StatusCodes.MOVED_TEMPORARILY, "/auth/email-verification");
    throw redirect(StatusCodes.MOVED_TEMPORARILY, "/");
  }
  return {};
};
