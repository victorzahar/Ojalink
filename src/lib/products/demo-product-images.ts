/**
 * Licensed reference photos for seeded demo products. Vendor-supplied imageUrl
 * values always take precedence; products without a matching entry keep the
 * normal placeholder.
 */
const demoProductImages: Record<string, string> = {
  "ankara-fabric-6-yards": "/images/products/ankara-fabric-6-yards.jpg",
  "french-lace-fabric-5-yards": "/images/products/french-lace-fabric-5-yards.jpg",
  "infinix-smart-9-128gb": "/images/products/infinix-smart-9-128gb.jpg",
  "tecno-pop-9-128gb": "/images/products/tecno-pop-9-128gb.jpg",
  "oraimo-20000mah-power-bank": "/images/products/oraimo-20000mah-power-bank.jpg",
  "usb-c-fast-charger-20w": "/images/products/usb-c-fast-charger-20w.jpg",
  "mama-pride-parboiled-rice-5kg": "/images/products/mama-pride-parboiled-rice-5kg.jpg",
  "golden-penny-spaghetti-500g": "/images/products/golden-penny-spaghetti-500g.jpg",
  "peak-milk-refill-400g": "/images/products/peak-milk-refill-400g.jpg",
  "big-bull-rice-5kg": "/images/products/big-bull-rice-5kg.jpg",
  "power-oil-1-litre": "/images/products/power-oil-1-litre.jpg",
  "indomie-regular-noodles-carton": "/images/products/indomie-regular-noodles-carton.jpg",
  "wired-earphones-microphone": "/images/products/wired-earphones-microphone.jpg",
  "plain-pattern-adire-6-yards": "/images/products/plain-pattern-adire-6-yards.jpg",
  "senator-material-4-yards": "/images/products/senator-material-4-yards.jpg",
  "fresh-tomatoes-1kg": "/images/products/fresh-tomatoes-1kg.jpg",
  "fresh-pepper-mix-500g": "/images/products/fresh-pepper-mix-500g.jpg",
  "ugu-leaves-bundle": "/images/products/ugu-leaves-bundle.jpg",
  "sweet-oranges-1kg": "/images/products/sweet-oranges-1kg.jpg",
  "samsung-galaxy-a06-128gb": "/images/products/samsung-galaxy-a06-128gb.jpg",
};

export function demoProductImage(slug: string) {
  return demoProductImages[slug] ?? null;
}
