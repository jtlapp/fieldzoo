/**
 * Types and classes used in tests.
 */

type VariableFieldsOf<T> = Omit<T, "id" | "__type">;

export class User {
  constructor(
    public id: number,
    public firstName: string,
    public lastName: string,
    public handle: string,
    public email: string
  ) {}

  static create(id: number, obj: VariableFieldsOf<User>): User {
    return new User(id, obj.firstName, obj.lastName, obj.handle, obj.email);
  }
}

export class InsertedUser extends User {
  readonly __type = "InsertedUser";

  static create(id: number, obj: VariableFieldsOf<InsertedUser>): InsertedUser {
    return new InsertedUser(
      id,
      obj.firstName,
      obj.lastName,
      obj.handle,
      obj.email
    );
  }
}

export class SelectedUser extends User {
  readonly __type = "SelectedUser";

  static create(id: number, obj: VariableFieldsOf<SelectedUser>): SelectedUser {
    return new SelectedUser(
      id,
      obj.firstName,
      obj.lastName,
      obj.handle,
      obj.email
    );
  }
}

export class UpdatedUser extends User {
  readonly __type = "UpdatedUser";

  static create(id: number, obj: VariableFieldsOf<UpdatedUser>): UpdatedUser {
    return new UpdatedUser(
      id,
      obj.firstName,
      obj.lastName,
      obj.handle,
      obj.email
    );
  }
}

export class InsertReturnedUser extends User {
  readonly __type = "InsertReturnedUser";

  static create(
    id: number,
    obj: VariableFieldsOf<InsertReturnedUser>
  ): InsertReturnedUser {
    return new InsertReturnedUser(
      id,
      obj.firstName,
      obj.lastName,
      obj.handle,
      obj.email
    );
  }
}

export class UpdateReturnedUser extends User {
  readonly __type = "UpdateReturnedUser";

  static create(
    id: number,
    obj: VariableFieldsOf<UpdateReturnedUser>
  ): UpdateReturnedUser {
    return new UpdateReturnedUser(
      id,
      obj.firstName,
      obj.lastName,
      obj.handle,
      obj.email
    );
  }
}
