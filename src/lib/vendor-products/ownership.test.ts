import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import { vendorProductScope, vendorProductsScope } from "./ownership";

const dialect = new PgDialect();

describe("vendor product database scopes", () => {
  it("limits a product lookup to both its product ID and signed-in vendor ID", () => {
    const query = dialect.sqlToQuery(vendorProductScope("vendor-a", "product-b"));
    expect(query.sql).toContain('"products"."id" = $1');
    expect(query.sql).toContain('"products"."vendor_id" = $2');
    expect(query.params).toEqual(["product-b", "vendor-a"]);
  });

  it("limits the product list to the signed-in vendor", () => {
    const query = dialect.sqlToQuery(vendorProductsScope("vendor-a"));
    expect(query.sql).toContain('"products"."vendor_id" = $1');
    expect(query.params).toEqual(["vendor-a"]);
  });
});
