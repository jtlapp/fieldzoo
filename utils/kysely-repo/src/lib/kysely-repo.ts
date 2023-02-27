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

export type BinaryKyselyOp<
  DB,
  TB extends keyof DB & string,
  RE extends ReferenceExpression<DB, TB>
> = [
  lhs: RE,
  op: ComparisonOperatorExpression,
  rhs: OperandValueExpressionOrList<DB, TB, RE>
];

// type TupleToObject<T extends readonly any[]> = {
//   [K in T[number]]: T[K];
// };

export class KyselyRepo<
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
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
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
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
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

  findSome(): Promise<Selectable<DB[TB]>[] | null>;
  findSome<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): Promise<Selectable<DB[TB]>[] | null>;
  findSome(grouper: WhereGrouper<DB, TB>): Promise<Selectable<DB[TB]>[] | null>;
  findSome(expression: Expression<any>): Promise<Selectable<DB[TB]>[] | null>;
  async findSome(...args: [any?, any?, any?]): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (args.length > 0) {
      qb = qb.where(...args);
    }
    return (await qb.execute()) || null;
  }

  async findById(id: number) {
    const { ref } = this.db.dynamic;
    const obj = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(ref(this.idFieldName), "=", id)
      .executeTakeFirst();
    return obj || null;
  }

  async insert(user: Insertable<DB[TB]>) {
    const obj = await this.db
      .insertInto(this.tableName)
      .values(user)
      .returningAll()
      .executeTakeFirstOrThrow();
    return obj;
  }

  select() {
    return this.db.selectFrom(this.tableName).selectAll();
  }
}
