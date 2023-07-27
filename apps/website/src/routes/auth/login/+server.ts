import { auth } from "$lib/server/lucia";
import { LuciaError } from "lucia";
import { error } from "@sveltejs/kit";
import { ValidationException } from "typebox-validators";
import { StatusCodes } from "http-status-codes";

import type { RequestHandler } from "./$types";
import { type LoginInfo, toLoginInfo } from "./login-info.js";

export const POST = (async ({ request, locals }) => {
  const data = await request.json();
  let loginInfo: LoginInfo;

  try {
    loginInfo = toLoginInfo({
      handle: data.handle as string,
      password: data.password as string,
    });
    console.log("**** loginInfo", loginInfo);
  } catch (e: unknown) {
    if (!(e instanceof ValidationException)) throw e;
    throw error(StatusCodes.BAD_REQUEST, { message: e.message });
  }

  try {
    // find user by key and validate password
    const user = await auth.useKey(
      "handle",
      loginInfo.handle,
      loginInfo.password
    );
    console.log("**** user", user);
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });
    console.log("**** session", session);
    locals.auth.setSession(session); // set session cookie
  } catch (e) {
    if (
      e instanceof LuciaError &&
      (e.message === "AUTH_INVALID_KEY_ID" ||
        e.message === "AUTH_INVALID_PASSWORD")
    ) {
      // user does not exist or invalid password
      throw error(StatusCodes.BAD_REQUEST, {
        message: "Incorrect handle or password " + e.message,
      });
    }
    throw error(StatusCodes.INTERNAL_SERVER_ERROR, {
      message: "An unknown error occurred",
    });
  }

  // TODO: update lastLoginAt

  return new Response(null, { status: StatusCodes.NO_CONTENT });
}) satisfies RequestHandler;
