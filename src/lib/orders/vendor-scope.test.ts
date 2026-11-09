import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import { vendorOrderScope, vendorOrdersScope } from "@/lib/orders/vendor-scope";

const dialect = new PgDialect();

describe("vendor order ownership scopes", () => {
  it("scopes the order list to the vendor id", () => {
    const query = dialect.sqlToQuery(vendorOrdersScope("vendor-a"));

    expect(query.sql).toContain('"orders"."vendor_id" = $1');
    expect(query.params).toEqual(["vendor-a"]);
  });

  it("scopes an order to both order id and vendor id", () => {
    const query = dialect.sqlToQuery(vendorOrderScope("vendor-a", "order-b"));

    expect(query.sql).toContain('"orders"."id" = $1');
    expect(query.sql).toContain('"orders"."vendor_id" = $2');
    expect(query.params).toEqual(["order-b", "vendor-a"]);
  });
});
