import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import {
  activeProductsScope,
  approvedVendorsScope,
  featuredVendorsScope,
  productSearchScope,
} from "@/lib/marketplace/scopes";

const dialect = new PgDialect();

describe("marketplace query scopes", () => {
  it("scopes approved vendors strictly to approval_status = 'approved'", () => {
    const query = dialect.sqlToQuery(approvedVendorsScope());

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.params).toEqual(["approved"]);
  });

  it("scopes featured vendors to approved AND is_featured = true", () => {
    const query = dialect.sqlToQuery(featuredVendorsScope());

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.sql).toContain('"vendors"."is_featured" = $2');
    expect(query.params).toEqual(["approved", true]);
  });

  it("scopes active products to approved vendor and is_available = true", () => {
    const query = dialect.sqlToQuery(activeProductsScope());

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.sql).toContain('"products"."is_available" = $2');
    expect(query.params).toEqual(["approved", true]);
  });

  it("parameterises product name search query with ilike", () => {
    const query = dialect.sqlToQuery(productSearchScope({ q: "yam" }));

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.sql).toContain('"products"."is_available" = $2');
    expect(query.sql).toContain('"products"."name" ilike $3');
    expect(query.params).toEqual(["approved", true, "%yam%"]);
  });

  it("parameterises category filtering and name query simultaneously", () => {
    const query = dialect.sqlToQuery(
      productSearchScope({ q: "rice", categorySlug: "provisions" })
    );

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.sql).toContain('"products"."is_available" = $2');
    expect(query.sql).toContain('"products"."name" ilike $3');
    expect(query.sql).toContain('"categories"."slug" = $4');
    expect(query.params).toEqual(["approved", true, "%rice%", "provisions"]);
  });
});
