import {
  Kysely,
  Insertable,
  Expression,
  ReferenceExpression,
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  Selectable,
  Updateable,
} from "kysely";
import { WhereGrouper } from "kysely/dist/cjs/parser/binary-operation-parser";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";
import { SingleResultType } from "kysely/dist/cjs/util/type-utils";

export type BinaryKyselyOp<
  DB,
  TB extends keyof DB & string,
  RE extends ReferenceExpression<DB, TB>
> = [
  lhs: RE,
  op: ComparisonOperatorExpression,
  rhs: OperandValueExpressionOrList<DB, TB, RE>
];

interface TakeFirstBuilder<O> {
  executeTakeFirst(): Promise<SingleResultType<O>>;
}
interface TakeManyBuilder<O> {
  execute(): Promise<O[]>;
}

export class KyselyTable<
  DB,
  TB extends keyof DB & string,
  ID extends keyof DB[TB] & string
> {
  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TB,
    readonly idFieldName: ID
  ) {}

  async deleteById(id: number): Promise<boolean> {
    const { ref } = this.db.dynamic;
    const result = await this.db
      .deleteFrom(this.tableName)
      .where(ref(this.idFieldName), "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) == 1;
  }

  find(): Promise<Selectable<DB[TB]>[] | null>;
  find<RE extends ReferenceExpression<DB, TB>>(
    ...args: BinaryKyselyOp<DB, TB, RE>
  ): Promise<Selectable<DB[TB]>[] | null>;
  find(grouper: WhereGrouper<DB, TB>): Promise<Selectable<DB[TB]>[] | null>;
  find(expression: Expression<any>): Promise<Selectable<DB[TB]>[] | null>;
  async find(...args: [any?, any?, any?]): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (args.length > 0) {
      qb = qb.where(...args);
    }
    return (await qb.execute()) || null;
  }

  findOne<RE extends ReferenceExpression<DB, TB>>(
    ...args: BinaryKyselyOp<DB, TB, RE>
  ): Promise<Selectable<DB[TB]> | null>;
  findOne(grouper: WhereGrouper<DB, TB>): Promise<Selectable<DB[TB]> | null>;
  findOne(expression: Expression<any>): Promise<Selectable<DB[TB]> | null>;
  async findOne(...args: [any, any?, any?]): Promise<any> {
    const obj = this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(...args)
      .executeTakeFirst();
    return obj || null;
  }

  async findSome<RE extends ReferenceExpression<DB, TB>>(constraints: {
    offset: number;
    limit: number;
    where?: BinaryKyselyOp<DB, TB, RE> | WhereGrouper<DB, TB> | Expression<any>;
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

  async selectById(id: number) {
    const { ref } = this.db.dynamic;
    const obj = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(ref(this.idFieldName), "=", id)
      .executeTakeFirst();
    return obj || null;
  }

  async updateById(obj: Updateable<DB[TB]>) {
    const { ref } = this.db.dynamic;
    await this.db
      .updateTable(this.tableName)
      .set(obj as any)
      .where(ref(this.idFieldName), "=", (obj as any)[this.idFieldName])
      .executeTakeFirst();
  }

  async insertOne(obj: Insertable<DB[TB]>) {
    const resultObj = await this.db
      .insertInto(this.tableName)
      .values(obj)
      .returningAll()
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
    QB extends TakeFirstBuilder<Selectable<DB[TB]>>,
    S extends keyof DB
  >(
    query: (
      qb: ReturnType<SelectAllQueryBuilder<DB, TB, object, S>["selectAll"]>
    ) => QB
  ) {
    const qb = this.db.selectFrom(this.tableName).selectAll();
    return (await query(qb as any).executeTakeFirst()) || null;
  }

  async selectMany<
    QB extends TakeManyBuilder<Selectable<DB[TB]>>,
    S extends keyof DB
  >(
    query: (
      qb: ReturnType<SelectAllQueryBuilder<DB, TB, object, S>["selectAll"]>
    ) => QB
  ) {
    const qb = this.db.selectFrom(this.tableName).selectAll();
    return query(qb as any).execute();
  }
}
