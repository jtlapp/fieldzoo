import { redirect, fail } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";

import { type UserID, toUserID } from "@fieldzoo/system-model";

import { sendEmailVerificationLink } from "$lib/server/email";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  let userID: UserID;
  try {
    userID = toUserID(params.userID);
  } catch {
    return fail(StatusCodes.BAD_REQUEST);
  }

  const userRepo = locals.repos.userRepo;
  if (await userRepo.isEmailVerified(userID)) {
    throw redirect(StatusCodes.MOVED_TEMPORARILY, "/auth/login");
  }
  return {};
};

export const actions: Actions = {
  default: async ({ params, locals }) => {
    const userID = params.userID as UserID;
    try {
      const emailVerificationRepo = locals.repos.emailVerificationRepo;
      const token = await emailVerificationRepo.getToken(userID);
      await sendEmailVerificationLink(token);
      return { success: true };
    } catch {
      return fail(StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
