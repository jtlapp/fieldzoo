import { TimestampedEntity } from "../entities/timestamped-entity";

/**
 * Tests valid and invalid TimestampedEntity timestamps.
 */
export function testTimestamps(
  errorMessage: string,
  createEntity: (createdAt?: Date, modifiedAt?: Date) => TimestampedEntity
) {
  const user = createEntity(new Date("1/2/23"), new Date("1/2/23"));
  expect(user.createdAt).toEqual(new Date("1/2/23"));
  expect(user.modifiedAt).toEqual(new Date("1/2/23"));

  expect(() => createEntity(new Date("oopsie"))).toThrow(errorMessage);
  expect(() => createEntity("" as unknown as Date)).toThrow(errorMessage);
  expect(() => createEntity(new Date("1/2/23"), new Date("oopsie"))).toThrow(
    errorMessage
  );
  expect(() => createEntity(new Date("1/2/23"), "" as unknown as Date)).toThrow(
    errorMessage
  );
}
