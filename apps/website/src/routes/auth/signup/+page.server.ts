import { fail, redirect } from "@sveltejs/kit";
import { ValidationException } from "typebox-validators";
import { StatusCodes } from "http-status-codes";

import { DatabaseError, PG_UNIQUE_VIOLATION } from "@fieldzoo/postgres-utils";

import { auth } from "$lib/server/lucia";
import type { Actions, PageServerLoad } from "./$types";
import { type SignUpInfo, toSignUpInfo } from "./signup-info.js";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) throw redirect(StatusCodes.MOVED_TEMPORARILY, "/profile");
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    console.log("**** auth/signup");
    const formData = await request.formData();
    let signUpInfo: SignUpInfo;

    try {
      signUpInfo = toSignUpInfo({
        name: formData.get("name") as string,
        userHandle: formData.get("userHandle") as string,
        password: formData.get("password") as string,
      });
      console.log("**** signUpInfo", signUpInfo);
    } catch (e: unknown) {
      if (!(e instanceof ValidationException)) throw e;
      return fail(StatusCodes.BAD_REQUEST, { message: e.message });
    }

    try {
      const user = await auth.createUser({
        key: {
          providerId: "userHandle", // auth method
          providerUserId: signUpInfo.userHandle, // unique id
          password: signUpInfo.password, // hashed by Lucia
        },
        attributes: {
          email: "temp@xyz.com",
          name: signUpInfo.name,
          userHandle: signUpInfo.userHandle,
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
          message: "Email or user handle already taken",
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
