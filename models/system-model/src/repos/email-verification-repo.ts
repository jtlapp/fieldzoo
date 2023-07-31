import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { createBase64UUID } from "@fieldzoo/base64-uuid";

import { Database } from "../tables/table-interfaces";
import { VerificationToken } from "../values/verification-token.js";
import { UserID } from "../values/user-id";

// adapted solution from https://github.com/pilcrowOnPaper/lucia/blob/main/examples/sveltekit/email-and-password/src/lib/server/token.ts

/**
 * Repository for email verifications.
 */
export class EmailVerificationRepo {
  readonly #table: ReturnType<EmailVerificationRepo["getMapper"]>;

  constructor(
    readonly db: Kysely<Database>,
    readonly expireAfterMillis = 1000 * 60 * 60 * 2 // 2 hours
  ) {
    this.#table = this.getMapper(db);
  }

  /**
   * Deletes all expired email verification tokens.
   */
  async deleteExpiredTokens(): Promise<void> {
    await this.#table
      .delete("expiresAt", "<", BigInt(new Date().getTime()))
      .run();
  }

  /**
   * Returns an email verification token for the given user. If the user
   * already has a token not set to expire within half the expiration time,
   * that token will be returned. Otherwise, generates and returns a new token.
   * @param userID ID of user to generate token for
   * @returns Email verification token for the given user
   */
  async getToken(userID: UserID): Promise<VerificationToken> {
    const epoch = new Date().getTime();

    const existingEntry = await this.#table
      .select(({ and, cmpr }) =>
        and([
          cmpr("userID", "=", userID),
          cmpr("expiresAt", ">", BigInt(epoch + this.expireAfterMillis / 2)),
        ])
      )
      .returnOne();
    if (existingEntry !== null) {
      return existingEntry.token as VerificationToken;
    }

    const newEntry = {
      token: createBase64UUID() as VerificationToken,
      userID,
      expiresAt: epoch + this.expireAfterMillis,
    };
    await this.#table.insert().run(newEntry);
    return newEntry.token;
  }

  /**
   * Verifies that a token is valid and returns the user ID associated with
   * the token. If the token is valid, it is deleted from the database.
   * @param token Token to validate
   * @returns User ID associated with the token, or null if the token is
   *  not valid.
   */
  async verifyToken(token: VerificationToken): Promise<UserID | null> {
    const entry = await this.#table.select(token).returnOne();
    if (entry === null) {
      return null;
    }
    await this.#table.delete(token).run();
    if (new Date().getTime() > entry.expiresAt) {
      return null;
    }
    return entry.userID as UserID;
  }

  /**
   * Gets a mapper for the email verifications table. This is a method so
   * that the mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "email_verifications", {
      keyColumns: ["token"],
    }).withTransforms({
      selectTransform: (entry) => ({
        ...entry,
        expiresAt: Number(entry.expiresAt),
      }),
    });
  }
}
