import { fail, redirect } from "@sveltejs/kit";
import { ValidationException } from "typebox-validators";
import { StatusCodes } from "http-status-codes";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import { DatabaseError, PG_UNIQUE_VIOLATION } from "@fieldzoo/postgres-utils";

import { type Credentials, toCredentials } from "$lib/server/credentials";
import { sendEmailVerificationLink } from "$lib/server/email";
import type { Actions, PageServerLoad } from "./$types";
import type { UserID } from "@fieldzoo/system-model";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) throw redirect(StatusCodes.MOVED_TEMPORARILY, "/profile");
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    let credentials: Credentials;

    try {
      credentials = toCredentials({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
    } catch (e: unknown) {
      if (!(e instanceof ValidationException)) throw e;
      return fail(StatusCodes.BAD_REQUEST, { message: e.message });
    }

    let userID: UserID;
    try {
      const luciaUser = await locals.lucia.createUser({
        userId: createBase64UUID(),
        key: {
          providerId: "email", // identifying field
          providerUserId: credentials.email, // unique id
          password: credentials.password, // hashed by Lucia
        },
        attributes: {
          email: credentials.email,
          emailVerified: false,
          displayName: null,
          userHandle: null,
          lastLoginAt: null,
          disabledAt: null,
        },
      });
      userID = luciaUser.userId as UserID;
      const emailVerificationRepo = locals.repos.emailVerificationRepo;
      const token = await emailVerificationRepo.getToken(userID);
      await sendEmailVerificationLink(token);
    } catch (e) {
      if (e instanceof DatabaseError && e.code === PG_UNIQUE_VIOLATION) {
        return fail(StatusCodes.BAD_REQUEST, {
          message: "Email address already is use",
        });
      }
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Internal server error",
      });
    }

    throw redirect(
      StatusCodes.MOVED_TEMPORARILY,
      "/auth/email-verification/" + userID
    );
  },
};
