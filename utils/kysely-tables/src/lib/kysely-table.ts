import {
  Kysely,
  Insertable,
  Expression,
  ReferenceExpression,
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  Selectable,
} from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";
import { SingleResultType } from "kysely/dist/cjs/util/type-utils";

type NonAsterisk<S> = S extends "*" ? never : S;

interface TakeFirstBuilder<O> {
  executeTakeFirst(): Promise<SingleResultType<O>>;
}
interface TakeManyBuilder<O> {
  execute(): Promise<O[]>;
}

export class KyselyTable<DB, TableName extends keyof DB & string> {
  constructor(readonly db: Kysely<DB>, readonly tableName: TableName) {}

  insertRows() {
    return this.db.insertInto(this.tableName);
  }

  updateRows() {
    return this.db.updateTable(this.tableName);
  }

  selectRows() {
    return this.db.selectFrom(this.tableName).selectAll();
  }

  deleteRows() {
    return this.db.deleteFrom(this.tableName);
  }

  insertOne(obj: Insertable<DB[TableName]>): Promise<void>;
  insertOne<
    O extends Selectable<DB[TableName]>,
    F extends NonAsterisk<keyof O>
  >(obj: Insertable<DB[TableName]>, returning: F[]): Promise<Pick<O, F>>;
  insertOne<O extends Selectable<DB[TableName]>>(
    obj: Insertable<DB[TableName]>,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>>;
  async insertOne<
    O extends Selectable<DB[TableName]>,
    F extends NonAsterisk<keyof O> & keyof DB[TableName] & string
  >(
    obj: Insertable<DB[TableName]>,
    returning?: F[] | ["*"]
  ): Promise<Selectable<DB[TableName]> | Pick<O, F> | void> {
    const qb = this.db.insertInto(this.tableName).values(obj);
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().executeTakeFirstOrThrow();
        return result as Selectable<DB[TableName]>;
      }
      const result = await qb
        .returning(returning as any)
        .executeTakeFirstOrThrow();
      return result as Pick<O, F>;
    }
    await qb.execute();
  }

  selectMany(): Promise<Selectable<DB[TableName]>[]>;
  selectMany<RE extends ReferenceExpression<DB, TableName>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TableName, RE>
  ): Promise<Selectable<DB[TableName]>[]>;
  selectMany<
    QB extends TakeManyBuilder<Selectable<DB[TableName]>>,
    S extends keyof DB
  >(
    query: (
      qb: ReturnType<
        SelectAllQueryBuilder<DB, TableName, object, S>["selectAll"]
      >
    ) => QB
  ): Promise<Selectable<DB[TableName]>[]>;
  selectMany(expression: Expression<any>): Promise<Selectable<DB[TableName]>[]>;
  async selectMany(...args: [any?, any?, any?]): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (args.length > 0) {
      if (typeof args[0] == "function") {
        qb = args[0](qb);
      } else {
        qb = qb.where(...args);
      }
    }
    return qb.execute();
  }

  selectOne(): Promise<Selectable<DB[TableName]> | null>;
  selectOne<RE extends ReferenceExpression<DB, TableName>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TableName, RE>
  ): Promise<Selectable<DB[TableName]> | null>;
  selectOne<
    QB extends TakeFirstBuilder<Selectable<DB[TableName]>>,
    S extends keyof DB
  >(
    query: (
      qb: ReturnType<
        SelectAllQueryBuilder<DB, TableName, object, S>["selectAll"]
      >
    ) => QB
  ): Promise<Selectable<DB[TableName]> | null>;
  selectOne(
    expression: Expression<any>
  ): Promise<Selectable<DB[TableName]> | null>;
  async selectOne(...args: [any?, any?, any?]): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (args.length > 0) {
      if (typeof args[0] == "function") {
        qb = args[0](qb);
      } else {
        qb = qb.where(...args);
      }
    }
    return (await qb.executeTakeFirst()) || null;
  }
}
