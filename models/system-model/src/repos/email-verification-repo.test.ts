import {
  getTestDB,
  closeTestDB,
  resetTestDB,
  sleep,
} from "@fieldzoo/testing-utils";

import { createTestUser } from "../test";
import { EmailVerificationRepo } from "./email-verification-repo";
import { VerificationToken } from "../values/verification-token";

const EXPIRES_AFTER_MILLIS = 200;

const db = getTestDB();
const emailVerificationRepo = new EmailVerificationRepo(
  db,
  EXPIRES_AFTER_MILLIS
);

afterAll(() => closeTestDB());

describe("email verification tokens repo", () => {
  it("finds a token before its expiration", async () => {
    await resetTestDB();
    const user = await createTestUser(db, "Jim", "jim@abc.com");
    const token1 = await emailVerificationRepo.getToken(user.id);

    // test returning same token prior to expiration
    const token2 = await emailVerificationRepo.getToken(user.id);
    expect(token2).toEqual(token1);

    // test finding token
    const userID = await emailVerificationRepo.verifyToken(token1);
    expect(userID).toEqual(user.id);

    // test finding token again, after it's been used
    const userID2 = await emailVerificationRepo.verifyToken(token1);
    expect(userID2).toBeNull();
  });

  it("does not find a token after its expiration", async () => {
    await resetTestDB();
    const user = await createTestUser(db, "Jim", "jim@abc.com");
    const token = await emailVerificationRepo.getToken(user.id);

    await sleep(EXPIRES_AFTER_MILLIS + 1);
    const userID = await emailVerificationRepo.verifyToken(token);
    expect(userID).toBeNull();
  });

  it("removes unused expired tokens", async () => {
    await resetTestDB();
    const user1 = await createTestUser(db, "Jim", "jim@abc.com");
    const user2 = await createTestUser(db, "Joe", "joe@abc.com");

    const token1 = await emailVerificationRepo.getToken(user1.id);
    await sleep(EXPIRES_AFTER_MILLIS + 1);

    const token2 = await emailVerificationRepo.getToken(user2.id);
    await emailVerificationRepo.deleteExpiredTokens();

    // the older token should have been deleted
    const userID1 = await emailVerificationRepo.verifyToken(token1);
    expect(userID1).toBeNull();

    // the newer token should not have been deleted
    const userID2 = await emailVerificationRepo.verifyToken(token2);
    expect(userID2).toEqual(user2.id);
  });

  it("does not find invalid tokens", async () => {
    await resetTestDB();
    const user = await createTestUser(db, "Jim", "jim@abc.com");
    const token = await emailVerificationRepo.getToken(user.id);
    const invalidToken = (token + "x") as VerificationToken;

    const userID = await emailVerificationRepo.verifyToken(invalidToken);
    expect(userID).toBeNull();
  });
});
