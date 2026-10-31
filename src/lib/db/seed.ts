import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const requiredSeedVariables = [
  "SEED_ADMIN_PASSWORD",
  "SEED_BUYER_PASSWORD",
  "SEED_VENDOR_PASSWORD",
  "SEED_RIDER_PASSWORD",
] as const;

for (const variable of requiredSeedVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is required to seed demo accounts.`);
  }
}

const [{ auth }, { getDb }, schema, { setUserRoleAsAdmin }] = await Promise.all([
  import("@/lib/auth"),
  import("@/lib/db"),
  import("@/lib/db/schema"),
  import("@/lib/auth/roles"),
]);

const { eq } = await import("drizzle-orm");
const { markets, categories, vendors, products, users } = schema;
const db = getDb();

type SeedUser = {
  email: string;
  name: string;
  password: string;
};

async function ensureUser({ email, name, password }: SeedUser) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return existingUser;
  }

  await auth.api.signUpEmail({
    body: { email, name, password },
  });

  const [createdUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!createdUser) {
    throw new Error(`Better Auth did not create ${email}.`);
  }

  return createdUser;
}

const seedMarkets = [
  {
    name: "Oba Market",
    slug: "oba-market",
    area: "Ring Road",
    description: "A busy central market in Benin City.",
  },
  {
    name: "New Benin Market",
    slug: "new-benin-market",
    area: "New Benin",
    description: "A popular market for household goods and electronics.",
  },
  {
    name: "Uselu Market",
    slug: "uselu-market",
    area: "Uselu",
    description: "A neighbourhood market serving Uselu and nearby areas.",
  },
] as const;

const seedCategories = [
  { name: "Fabrics", slug: "fabrics" },
  { name: "Phones & Accessories", slug: "phones-accessories" },
  { name: "Provisions", slug: "provisions" },
  { name: "Fresh Produce", slug: "fresh-produce" },
] as const;

const seedVendors = [
  {
    email: "vendor@ojalink.test",
    name: "Adaeze Okafor",
    shopName: "Adaeze Fabrics",
    slug: "adaeze-fabrics",
    marketSlug: "oba-market",
    isFeatured: true,
    description: "Ankara, lace and quality fabric for everyday wear and occasions.",
  },
  {
    email: "gadget@ojalink.test",
    name: "Ifeanyi Eze",
    shopName: "Benin Gadget Hub",
    slug: "benin-gadget-hub",
    marketSlug: "new-benin-market",
    isFeatured: true,
    description: "New phones, chargers and everyday mobile accessories.",
  },
  {
    email: "provisions@ojalink.test",
    name: "Blessing Osagie",
    shopName: "Edo Provisions Mart",
    slug: "edo-provisions-mart",
    marketSlug: "uselu-market",
    isFeatured: false,
    description: "Essential household provisions for your kitchen and pantry.",
  },
  {
    email: "fresh@ojalink.test",
    name: "Ngozi Ekhator",
    shopName: "Omo Fresh Produce",
    slug: "omo-fresh-produce",
    marketSlug: "oba-market",
    isFeatured: true,
    description: "Fresh vegetables, fruits and cooking ingredients from Benin City markets.",
  },
  {
    email: "homestores@ojalink.test",
    name: "Sunday Igbinidu",
    shopName: "Uselu Home Stores",
    slug: "uselu-home-stores",
    marketSlug: "uselu-market",
    isFeatured: false,
    description: "Rice, cooking oil and reliable home essentials.",
  },
  {
    email: "mobile@ojalink.test",
    name: "Kingsley Omoruyi",
    shopName: "Kingsway Mobile",
    slug: "kingsway-mobile",
    marketSlug: "new-benin-market",
    isFeatured: false,
    description: "Budget smartphones and accessories for work and school.",
  },
] as const;

const seedProducts = [
  { vendorSlug: "adaeze-fabrics", categorySlug: "fabrics", name: "Ankara fabric, 6 yards", slug: "ankara-fabric-6-yards", priceKobo: 650000, stockQuantity: 24 },
  { vendorSlug: "adaeze-fabrics", categorySlug: "fabrics", name: "French lace fabric, 5 yards", slug: "french-lace-fabric-5-yards", priceKobo: 1850000, stockQuantity: 12 },
  { vendorSlug: "adaeze-fabrics", categorySlug: "fabrics", name: "Plain and pattern adire, 6 yards", slug: "plain-pattern-adire-6-yards", priceKobo: 900000, stockQuantity: 18 },
  { vendorSlug: "adaeze-fabrics", categorySlug: "fabrics", name: "Senator material, 4 yards", slug: "senator-material-4-yards", priceKobo: 750000, stockQuantity: 20 },
  { vendorSlug: "benin-gadget-hub", categorySlug: "phones-accessories", name: "Infinix Smart 9, 128 GB", slug: "infinix-smart-9-128gb", priceKobo: 12500000, stockQuantity: 8 },
  { vendorSlug: "benin-gadget-hub", categorySlug: "phones-accessories", name: "Tecno Pop 9, 128 GB", slug: "tecno-pop-9-128gb", priceKobo: 11800000, stockQuantity: 7 },
  { vendorSlug: "benin-gadget-hub", categorySlug: "phones-accessories", name: "Oraimo 20,000 mAh power bank", slug: "oraimo-20000mah-power-bank", priceKobo: 2800000, stockQuantity: 16 },
  { vendorSlug: "benin-gadget-hub", categorySlug: "phones-accessories", name: "USB-C fast charger, 20 W", slug: "usb-c-fast-charger-20w", priceKobo: 850000, stockQuantity: 30 },
  { vendorSlug: "edo-provisions-mart", categorySlug: "provisions", name: "Mama Pride parboiled rice, 5 kg", slug: "mama-pride-parboiled-rice-5kg", priceKobo: 1350000, stockQuantity: 22 },
  { vendorSlug: "edo-provisions-mart", categorySlug: "provisions", name: "Golden Penny spaghetti, 500 g", slug: "golden-penny-spaghetti-500g", priceKobo: 135000, stockQuantity: 50 },
  { vendorSlug: "edo-provisions-mart", categorySlug: "provisions", name: "Peak milk refill, 400 g", slug: "peak-milk-refill-400g", priceKobo: 245000, stockQuantity: 35 },
  { vendorSlug: "omo-fresh-produce", categorySlug: "fresh-produce", name: "Fresh tomatoes, 1 kg", slug: "fresh-tomatoes-1kg", priceKobo: 180000, stockQuantity: 40 },
  { vendorSlug: "omo-fresh-produce", categorySlug: "fresh-produce", name: "Fresh pepper mix, 500 g", slug: "fresh-pepper-mix-500g", priceKobo: 150000, stockQuantity: 35 },
  { vendorSlug: "omo-fresh-produce", categorySlug: "fresh-produce", name: "Ugu leaves, one bundle", slug: "ugu-leaves-bundle", priceKobo: 70000, stockQuantity: 25 },
  { vendorSlug: "omo-fresh-produce", categorySlug: "fresh-produce", name: "Sweet oranges, 1 kg", slug: "sweet-oranges-1kg", priceKobo: 220000, stockQuantity: 28 },
  { vendorSlug: "uselu-home-stores", categorySlug: "provisions", name: "Big Bull rice, 5 kg", slug: "big-bull-rice-5kg", priceKobo: 1450000, stockQuantity: 16 },
  { vendorSlug: "uselu-home-stores", categorySlug: "provisions", name: "Power oil, 1 litre", slug: "power-oil-1-litre", priceKobo: 210000, stockQuantity: 30 },
  { vendorSlug: "uselu-home-stores", categorySlug: "provisions", name: "Indomie regular noodles, carton", slug: "indomie-regular-noodles-carton", priceKobo: 780000, stockQuantity: 14 },
  { vendorSlug: "kingsway-mobile", categorySlug: "phones-accessories", name: "Samsung Galaxy A06, 128 GB", slug: "samsung-galaxy-a06-128gb", priceKobo: 14500000, stockQuantity: 6 },
  { vendorSlug: "kingsway-mobile", categorySlug: "phones-accessories", name: "Wired earphones with microphone", slug: "wired-earphones-microphone", priceKobo: 350000, stockQuantity: 24 },
] as const;

async function seed() {
  const admin = await ensureUser({
    email: "admin@ojalink.test",
    name: "OjaLink Admin",
    password: process.env.SEED_ADMIN_PASSWORD!,
  });

  // This is a trusted server-side bootstrap step. Public sign-up always creates buyers.
  await db.update(users).set({ role: "admin" }).where(eq(users.id, admin.id));

  await ensureUser({
    email: "buyer@ojalink.test",
    name: "Amaka Nwosu",
    password: process.env.SEED_BUYER_PASSWORD!,
  });

  const rider = await ensureUser({
    email: "rider@ojalink.test",
    name: "Emmanuel Okon",
    password: process.env.SEED_RIDER_PASSWORD!,
  });
  await setUserRoleAsAdmin({ actorId: admin.id, userId: rider.id, role: "rider" });

  const marketBySlug = new Map<string, { id: string }>();
  for (const market of seedMarkets) {
    const [savedMarket] = await db
      .insert(markets)
      .values(market)
      .onConflictDoUpdate({ target: markets.slug, set: market })
      .returning({ id: markets.id, slug: markets.slug });
    marketBySlug.set(savedMarket.slug, savedMarket);
  }

  const categoryBySlug = new Map<string, { id: string }>();
  for (const category of seedCategories) {
    const [savedCategory] = await db
      .insert(categories)
      .values(category)
      .onConflictDoUpdate({ target: categories.slug, set: category })
      .returning({ id: categories.id, slug: categories.slug });
    categoryBySlug.set(savedCategory.slug, savedCategory);
  }

  const vendorBySlug = new Map<string, { id: string }>();
  for (const vendor of seedVendors) {
    const vendorUser = await ensureUser({
      email: vendor.email,
      name: vendor.name,
      password: process.env.SEED_VENDOR_PASSWORD!,
    });
    await setUserRoleAsAdmin({ actorId: admin.id, userId: vendorUser.id, role: "vendor" });

    const market = marketBySlug.get(vendor.marketSlug);
    if (!market) throw new Error(`Missing market ${vendor.marketSlug}.`);

    const [savedVendor] = await db
      .insert(vendors)
      .values({
        userId: vendorUser.id,
        marketId: market.id,
        shopName: vendor.shopName,
        slug: vendor.slug,
        description: vendor.description,
        approvalStatus: "approved",
        isFeatured: vendor.isFeatured,
      })
      .onConflictDoUpdate({
        target: vendors.slug,
        set: {
          marketId: market.id,
          shopName: vendor.shopName,
          description: vendor.description,
          approvalStatus: "approved",
          isFeatured: vendor.isFeatured,
        },
      })
      .returning({ id: vendors.id, slug: vendors.slug });
    vendorBySlug.set(savedVendor.slug, savedVendor);
  }

  for (const product of seedProducts) {
    const vendor = vendorBySlug.get(product.vendorSlug);
    const category = categoryBySlug.get(product.categorySlug);
    if (!vendor || !category) throw new Error(`Missing product relationship for ${product.name}.`);

    await db
      .insert(products)
      .values({
        vendorId: vendor.id,
        categoryId: category.id,
        name: product.name,
        slug: product.slug,
        priceKobo: product.priceKobo,
        stockQuantity: product.stockQuantity,
      })
      .onConflictDoUpdate({
        target: [products.vendorId, products.slug],
        set: {
          categoryId: category.id,
          name: product.name,
          priceKobo: product.priceKobo,
          stockQuantity: product.stockQuantity,
          isAvailable: true,
        },
      });
  }

  console.log("Seed complete: 3 markets, 4 categories, 6 vendors and 20 products.");
}

await seed();
