import {
  Kysely,
  Insertable,
  Expression,
  ReferenceExpression,
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  Selectable,
} from "kysely";
import { WhereGrouper } from "kysely/dist/cjs/parser/binary-operation-parser";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";
import { SingleResultType } from "kysely/dist/cjs/util/type-utils";

export type BinaryKyselyOp<
  DB,
  TableName extends keyof DB & string,
  RE extends ReferenceExpression<DB, TableName>
> = [
  lhs: RE,
  op: ComparisonOperatorExpression,
  rhs: OperandValueExpressionOrList<DB, TableName, RE>
];

interface TakeFirstBuilder<O> {
  executeTakeFirst(): Promise<SingleResultType<O>>;
}
interface TakeManyBuilder<O> {
  execute(): Promise<O[]>;
}

export class KyselyTable<DB, TableName extends keyof DB & string> {
  constructor(readonly db: Kysely<DB>, readonly tableName: TableName) {}

  find(): Promise<Selectable<DB[TableName]>[] | null>;
  find<RE extends ReferenceExpression<DB, TableName>>(
    ...args: BinaryKyselyOp<DB, TableName, RE>
  ): Promise<Selectable<DB[TableName]>[] | null>;
  find(
    grouper: WhereGrouper<DB, TableName>
  ): Promise<Selectable<DB[TableName]>[] | null>;
  find(
    expression: Expression<any>
  ): Promise<Selectable<DB[TableName]>[] | null>;
  async find(...args: [any?, any?, any?]): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (args.length > 0) {
      qb = qb.where(...args);
    }
    return (await qb.execute()) || null;
  }

  findOne<RE extends ReferenceExpression<DB, TableName>>(
    ...args: BinaryKyselyOp<DB, TableName, RE>
  ): Promise<Selectable<DB[TableName]> | null>;
  findOne(
    grouper: WhereGrouper<DB, TableName>
  ): Promise<Selectable<DB[TableName]> | null>;
  findOne(
    expression: Expression<any>
  ): Promise<Selectable<DB[TableName]> | null>;
  async findOne(...args: [any, any?, any?]): Promise<any> {
    const obj = this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(...args)
      .executeTakeFirst();
    return obj || null;
  }

  async findSome<RE extends ReferenceExpression<DB, TableName>>(constraints: {
    offset: number;
    limit: number;
    where?:
      | BinaryKyselyOp<DB, TableName, RE>
      | WhereGrouper<DB, TableName>
      | Expression<any>;
  }): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (constraints.where) {
      if (Array.isArray(constraints.where)) {
        qb = qb.where(...(constraints.where as [any, any, any]));
      } else {
        qb = qb.where(constraints.where as any);
      }
    }
    const objs = await qb
      .offset(constraints.offset)
      .limit(constraints.limit)
      .execute();
    return objs || null;
  }

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

  async selectOne<
    QB extends TakeFirstBuilder<Selectable<DB[TableName]>>,
    S extends keyof DB
  >(
    query: (
      qb: ReturnType<
        SelectAllQueryBuilder<DB, TableName, object, S>["selectAll"]
      >
    ) => QB
  ) {
    const qb = this.db.selectFrom(this.tableName).selectAll();
    return (await query(qb as any).executeTakeFirst()) || null;
  }

  async selectMany<
    QB extends TakeManyBuilder<Selectable<DB[TableName]>>,
    S extends keyof DB
  >(
    query: (
      qb: ReturnType<
        SelectAllQueryBuilder<DB, TableName, object, S>["selectAll"]
      >
    ) => QB
  ) {
    const qb = this.db.selectFrom(this.tableName).selectAll();
    return query(qb as any).execute();
  }
}
