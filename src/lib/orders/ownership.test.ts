import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import { buyerOrderScope, buyerOrdersScope } from "@/lib/orders/ownership";

const dialect = new PgDialect();

describe("buyer order ownership scopes", () => {
  it("scopes the order list to the buyer id", () => {
    const query = dialect.sqlToQuery(buyerOrdersScope("buyer-a"));

    expect(query.sql).toContain('"orders"."buyer_id" = $1');
    expect(query.params).toEqual(["buyer-a"]);
  });

  it("scopes an order to both order id and buyer id", () => {
    const query = dialect.sqlToQuery(buyerOrderScope("buyer-a", "order-b"));

    expect(query.sql).toContain('"orders"."id" = $1');
    expect(query.sql).toContain('"orders"."buyer_id" = $2');
    expect(query.params).toEqual(["order-b", "buyer-a"]);
  });
});
