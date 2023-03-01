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

interface TakeFirstBuilder<O> {
  executeTakeFirst(): Promise<SingleResultType<O>>;
}
interface TakeManyBuilder<O> {
  execute(): Promise<O[]>;
}

export class KyselyTable<DB, TableName extends keyof DB & string> {
  constructor(readonly db: Kysely<DB>, readonly tableName: TableName) {}

  async insertOne(obj: Insertable<DB[TableName]>) {
    const resultObj = await this.db
      .insertInto(this.tableName)
      .values(obj)
      .returningAll() // TODO: could be an unnecessary big hit
      .executeTakeFirstOrThrow();
    return resultObj;
  }

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
