import { fail, redirect } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";

import {
  type VerificationToken,
  toVerificationToken,
} from "@fieldzoo/system-model";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  let token: VerificationToken;
  try {
    token = toVerificationToken(params.token);
  } catch {
    return fail(StatusCodes.BAD_REQUEST);
  }

  const emailVerificationRepo = locals.repos.emailVerificationRepo;
  const userID = await emailVerificationRepo.verifyToken(token);
  if (userID === null) {
    throw redirect(StatusCodes.MOVED_TEMPORARILY, "/auth/expired-email-link");
  }

  const user = await locals.lucia.getUser(userID);
  await locals.lucia.invalidateAllUserSessions(user.userId);
  await locals.lucia.updateUserAttributes(user.userId, {
    emailVerified: true,
    lastLoginAt: new Date(),
  });
  const session = await locals.lucia.createSession({
    userId: user.userId,
    attributes: {},
  });
  locals.auth.setSession(session);
  // Redirect to another page to force layout to update for session.
  throw redirect(StatusCodes.MOVED_TEMPORARILY, "/auth/verify-email");
};
