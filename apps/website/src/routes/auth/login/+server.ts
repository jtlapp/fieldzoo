import { auth } from "$lib/server/lucia";
import { LuciaError } from "lucia";
import { error } from "@sveltejs/kit";
import { ValidationException } from "typebox-validators";
import { StatusCodes } from "http-status-codes";

import type { RequestHandler } from "./$types";
import { type Credentials, toCredentials } from "$lib/server/credentials";

export const POST = (async ({ request, locals }) => {
  const data = await request.json();
  let credentials: Credentials;

  try {
    credentials = toCredentials({
      email: data.email as string,
      password: data.password as string,
    });
  } catch (e: unknown) {
    if (!(e instanceof ValidationException)) throw e;
    throw error(StatusCodes.BAD_REQUEST, { message: e.message });
  }

  try {
    // find user by key and validate password
    const user = await auth.useKey(
      "email",
      credentials.email,
      credentials.password
    );
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });
    locals.auth.setSession(session); // set session cookie
  } catch (e) {
    if (
      e instanceof LuciaError &&
      (e.message === "AUTH_INVALID_KEY_ID" ||
        e.message === "AUTH_INVALID_PASSWORD")
    ) {
      throw error(StatusCodes.BAD_REQUEST, {
        message: "Incorrect email address or password",
      });
    }
    throw error(StatusCodes.INTERNAL_SERVER_ERROR, {
      message: "An unknown error occurred",
    });
  }

  // TODO: update lastLoginAt

  return new Response(null, { status: StatusCodes.NO_CONTENT });
}) satisfies RequestHandler;
