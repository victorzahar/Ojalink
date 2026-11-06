import { and, count, eq, gt, inArray, sql, sum } from "drizzle-orm";

import {
  getCartAddError,
  getCartLineAmounts,
  vendorAfterItemRemoval,
} from "@/lib/cart/policy";
import { cartBelongsToBuyer, buyerCartScope } from "@/lib/cart/ownership";
import { getDb, getTransactionalDb } from "@/lib/db";
import { cartItems, carts, products, vendors } from "@/lib/db/schema";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart/validation";
import { getAvailableStock } from "@/lib/checkout/stock";
import { stockReservations } from "@/lib/db/schema";

export type CartLine = {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPriceKobo: number;
  quantity: number;
  lineTotalKobo: number;
  stockQuantity: number;
  isAvailable: boolean;
  isVendorApproved: boolean;
  canIncrease: boolean;
};

export type BuyerCart = {
  vendorName: string | null;
  items: CartLine[];
  subtotalKobo: number;
};

export type CartMutationResult = {
  success: boolean;
  message: string;
};

type CartTransaction = Parameters<
  Parameters<ReturnType<typeof getTransactionalDb>["transaction"]>[0]
>[0];

export async function getBuyerCart(buyerId: string): Promise<BuyerCart> {
  const db = getDb();
  const [cart] = await db
    .select({ id: carts.id, vendorName: vendors.shopName })
    .from(carts)
    .leftJoin(vendors, eq(carts.vendorId, vendors.id))
    .where(buyerCartScope(buyerId))
    .limit(1);

  if (!cart) return { vendorName: null, items: [], subtotalKobo: 0 };

  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
      priceKobo: products.priceKobo,
      quantity: cartItems.quantity,
      stockQuantity: products.stockQuantity,
      isAvailable: products.isAvailable,
      vendorApprovalStatus: vendors.approvalStatus,
    })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(buyerCartScope(buyerId, cart.id));

  const reservedRows = rows.length === 0
    ? []
    : await db
        .select({
          productId: stockReservations.productId,
          quantity: sum(stockReservations.quantity),
        })
        .from(stockReservations)
        .where(and(
          inArray(stockReservations.productId, rows.map((row) => row.productId)),
          eq(stockReservations.status, "reserved"),
          gt(stockReservations.expiresAt, new Date()),
        ))
        .groupBy(stockReservations.productId);
  const reservedByProduct = new Map(
    reservedRows.flatMap((row) => row.productId
      ? [[row.productId, Number(row.quantity ?? 0)] as const]
      : []),
  );

  const items = rows.map((row) => {
    const amounts = getCartLineAmounts(row.priceKobo, row.quantity);
    const availableStock = getAvailableStock(
      row.stockQuantity,
      reservedByProduct.get(row.productId) ?? 0,
    );
    return {
      productId: row.productId,
      name: row.name,
      imageUrl: row.imageUrl,
      unitPriceKobo: amounts.unitPriceKobo,
      quantity: row.quantity,
      lineTotalKobo: amounts.lineTotalKobo,
      stockQuantity: availableStock,
      isAvailable: row.isAvailable,
      isVendorApproved: row.vendorApprovalStatus === "approved",
      canIncrease:
        row.isAvailable &&
        row.vendorApprovalStatus === "approved" &&
        row.quantity < Math.min(MAX_CART_ITEM_QUANTITY, availableStock),
    };
  });

  return {
    vendorName: cart.vendorName,
    items,
    subtotalKobo: items.reduce((sum, item) => sum + item.lineTotalKobo, 0),
  };
}

async function lockBuyerCart(tx: CartTransaction, buyerId: string) {
  await tx
    .insert(carts)
    .values({ buyerId })
    .onConflictDoNothing({ target: carts.buyerId });

  const [cart] = await tx
    .select({ id: carts.id, buyerId: carts.buyerId, vendorId: carts.vendorId })
    .from(carts)
    .where(buyerCartScope(buyerId))
    .for("update")
    .limit(1);

  if (!cart || !cartBelongsToBuyer(cart.buyerId, buyerId)) return null;
  return cart;
}

async function selectProductForUpdate(tx: CartTransaction, productId: string) {
  const [product] = await tx
    .select({
      id: products.id,
      vendorId: products.vendorId,
      name: products.name,
      isAvailable: products.isAvailable,
      stockQuantity: products.stockQuantity,
      priceKobo: products.priceKobo,
      vendorApprovalStatus: vendors.approvalStatus,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(products.id, productId))
    .for("update")
    .limit(1);
  return product ?? null;
}

export async function addCartItemForBuyer(
  buyerId: string,
  productId: string,
  quantityToAdd: number,
): Promise<CartMutationResult> {
  return getTransactionalDb().transaction(async (tx) => {
    const cart = await lockBuyerCart(tx, buyerId);
    if (!cart) return { success: false, message: "We couldn’t open your cart. Try again." };

    const product = await selectProductForUpdate(tx, productId);
    if (!product) return { success: false, message: "This product is no longer available." };

    const [existing] = await tx
      .select({ quantity: cartItems.quantity })
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .limit(1);

    const [reserved] = await tx
      .select({ quantity: sum(stockReservations.quantity) })
      .from(stockReservations)
      .where(and(
        eq(stockReservations.productId, productId),
        eq(stockReservations.status, "reserved"),
        gt(stockReservations.expiresAt, new Date()),
      ));
    const availableStock = getAvailableStock(
      product.stockQuantity,
      Number(reserved?.quantity ?? 0),
    );

    const error = getCartAddError({
      cartVendorId: cart.vendorId,
      productVendorId: product.vendorId,
      vendorApprovalStatus: product.vendorApprovalStatus,
      isAvailable: product.isAvailable,
      stockQuantity: availableStock,
      currentQuantity: existing?.quantity ?? 0,
      quantityToAdd,
    });
    if (error) return { success: false, message: error };

    const quantityLimit = Math.min(MAX_CART_ITEM_QUANTITY, availableStock);
    const [upserted] = await tx
      .insert(cartItems)
      .values({ cartId: cart.id, productId: product.id, quantity: quantityToAdd })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: {
          quantity: sql`${cartItems.quantity} + ${quantityToAdd}`,
          updatedAt: new Date(),
        },
        setWhere: sql`${cartItems.quantity} + ${quantityToAdd} <= ${quantityLimit}`,
      })
      .returning({ id: cartItems.id });

    if (!upserted) {
      return {
        success: false,
        message: `You can add up to ${quantityLimit} of this product based on available stock.`,
      };
    }

    if (cart.vendorId === null) {
      await tx
        .update(carts)
        .set({ vendorId: product.vendorId, updatedAt: new Date() })
        .where(buyerCartScope(buyerId, cart.id));
    }

    return { success: true, message: `${product.name} added to your cart.` };
  });
}

export async function setCartItemQuantityForBuyer(
  buyerId: string,
  productId: string,
  quantity: number,
): Promise<CartMutationResult> {
  return getTransactionalDb().transaction(async (tx) => {
    const cart = await lockBuyerCart(tx, buyerId);
    if (!cart) return { success: false, message: "We couldn’t find that cart item." };

    const [existing] = await tx
      .select({ quantity: cartItems.quantity })
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .limit(1);
    if (!existing) return { success: false, message: "We couldn’t find that cart item." };

    if (quantity > existing.quantity) {
      const product = await selectProductForUpdate(tx, productId);
      if (!product) return { success: false, message: "This product is no longer available." };
      const [reserved] = await tx
        .select({ quantity: sum(stockReservations.quantity) })
        .from(stockReservations)
        .where(and(
          eq(stockReservations.productId, productId),
          eq(stockReservations.status, "reserved"),
          gt(stockReservations.expiresAt, new Date()),
        ));
      const error = getCartAddError({
        cartVendorId: cart.vendorId,
        productVendorId: product.vendorId,
        vendorApprovalStatus: product.vendorApprovalStatus,
        isAvailable: product.isAvailable,
        stockQuantity: getAvailableStock(
          product.stockQuantity,
          Number(reserved?.quantity ?? 0),
        ),
        currentQuantity: 0,
        quantityToAdd: quantity,
      });
      if (error) return { success: false, message: error };
    }

    await tx
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));

    return { success: true, message: "Cart quantity updated." };
  });
}

export async function removeCartItemForBuyer(
  buyerId: string,
  productId: string,
): Promise<CartMutationResult> {
  return getTransactionalDb().transaction(async (tx) => {
    const cart = await lockBuyerCart(tx, buyerId);
    if (!cart) return { success: false, message: "We couldn’t find that cart item." };

    const [deleted] = await tx
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .returning({ id: cartItems.id });
    if (!deleted) return { success: false, message: "We couldn’t find that cart item." };

    const [remaining] = await tx
      .select({ value: count() })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));
    const vendorId = vendorAfterItemRemoval(cart.vendorId, remaining.value);
    if (vendorId !== cart.vendorId) {
      await tx
        .update(carts)
        .set({ vendorId, updatedAt: new Date() })
        .where(buyerCartScope(buyerId, cart.id));
    }

    return { success: true, message: "Item removed from your cart." };
  });
}
