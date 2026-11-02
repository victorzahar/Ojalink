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

  it("parameterises product name OR vendor shop name search with ilike", () => {
    const query = dialect.sqlToQuery(productSearchScope({ q: "yam" }));

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.sql).toContain('"products"."is_available" = $2');
    expect(query.sql).toContain('"products"."name" ilike $3');
    expect(query.sql).toContain('"vendors"."shop_name" ilike $4');
    expect(query.params).toEqual(["approved", true, "%yam%", "%yam%"]);
  });

  it("escapes LIKE wildcard characters in the search query", () => {
    const query = dialect.sqlToQuery(productSearchScope({ q: "50%" }));

    expect(query.sql).not.toContain("%50%%");
    expect(query.params).toEqual(["approved", true, "%50\\%%", "%50\\%%"]);
  });

  it("filters the search to one vendor by slug", () => {
    const query = dialect.sqlToQuery(productSearchScope({ vendorSlug: "mama-nkechi" }));

    expect(query.sql).toContain('"vendors"."slug" = $3');
    expect(query.params).toEqual(["approved", true, "mama-nkechi"]);
  });

  it("parameterises category filtering and name query simultaneously", () => {
    const query = dialect.sqlToQuery(
      productSearchScope({ q: "rice", categorySlug: "provisions" })
    );

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.sql).toContain('"products"."is_available" = $2');
    expect(query.sql).toContain('"products"."name" ilike $3');
    expect(query.sql).toContain('"categories"."slug" = $5');
    expect(query.params).toEqual([
      "approved",
      true,
      "%rice%",
      "%rice%",
      "provisions",
    ]);
  });
});
