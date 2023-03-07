/**
 * Types and classes used in tests.
 */

export class User {
  constructor(
    public id: number,
    public firstName: string,
    public lastName: string,
    public handle: string,
    public email: string
  ) {}
}

export class InsertedUser extends User {
  readonly __type = "InsertedUser";
}

export class SelectedUser extends User {
  readonly __type = "SelectedUser";
}

export class UpdatedUser extends User {
  readonly __type = "UpdatedUser";
}

export class InsertReturnedUser extends User {
  readonly __type = "InsertReturnedUser";
}

export class UpdateReturnedUser extends User {
  readonly __type = "UpdateReturnedUser";
}
