import { error, type RequestHandler } from "@sveltejs/kit";
import { ValidationException } from "typebox-validators";
import { StatusCodes } from "http-status-codes";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import { DatabaseError, PG_UNIQUE_VIOLATION } from "@fieldzoo/postgres-utils";

import { type Credentials, toCredentials } from "$lib/server/credentials";
import { sendEmailVerificationLink } from "$lib/server/email";
import type { UserID } from "@fieldzoo/system-model";

export const POST = (async ({ request, locals }) => {
  const data = await request.json();

  let credentials: Credentials;
  try {
    credentials = toCredentials(data);
  } catch (e: unknown) {
    if (!(e instanceof ValidationException)) throw e;
    throw error(StatusCodes.BAD_REQUEST, { message: e.message });
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
      throw error(StatusCodes.BAD_REQUEST, {
        message: "Email address already is use",
      });
    }
    throw error(StatusCodes.BAD_REQUEST);
  }
  // client should redirect to /auth/email-verification/:userID
  return new Response(JSON.stringify({ userID }), {
    status: StatusCodes.OK,
  });
}) satisfies RequestHandler;
