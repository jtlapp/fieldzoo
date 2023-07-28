import { fail, redirect } from "@sveltejs/kit";
import { ValidationException } from "typebox-validators";
import { StatusCodes } from "http-status-codes";

import { DatabaseError, PG_UNIQUE_VIOLATION } from "@fieldzoo/postgres-utils";

import { auth } from "$lib/server/lucia";
import type { Actions, PageServerLoad } from "./$types";
import { type Credentials, toCredentials } from "$lib/server/credentials";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) throw redirect(StatusCodes.MOVED_TEMPORARILY, "/profile");
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    console.log("**** auth/signup");
    const formData = await request.formData();
    let credentials: Credentials;

    try {
      credentials = toCredentials({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
      console.log("**** credentials", credentials);
    } catch (e: unknown) {
      if (!(e instanceof ValidationException)) throw e;
      return fail(StatusCodes.BAD_REQUEST, { message: e.message });
    }

    try {
      const user = await auth.createUser({
        key: {
          providerId: "email", // identifying field
          providerUserId: credentials.email, // unique id
          password: credentials.password, // hashed by Lucia
        },
        attributes: {
          email: credentials.email,
          displayName: null,
          userHandle: null,
          lastLoginAt: null,
          disabledAt: null,
        },
      });
      const session = await auth.createSession({
        userId: user.userId,
        attributes: {},
      });
      locals.auth.setSession(session); // set session cookie
    } catch (e) {
      if (e instanceof DatabaseError && e.code === PG_UNIQUE_VIOLATION) {
        return fail(StatusCodes.BAD_REQUEST, {
          message: "Email address already is use",
        });
      }
      console.log("**** e", e);
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: "An unknown error occurred",
      });
    }
    // TODO: update lastLoginAt

    // redirect to
    // make sure you don't throw inside a try/catch block!
    throw redirect(StatusCodes.MOVED_TEMPORARILY, "/");
  },
};
