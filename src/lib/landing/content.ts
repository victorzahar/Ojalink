import { ClipboardList, Search, Store, Truck } from "lucide-react";

export const landingCategories = [
  { label: "Fabrics", href: "/marketplace?category=fabrics", image: "/images/products/ankara-fabric-6-yards.jpg", imageAlt: "Colourful Ankara fabric" },
  { label: "Fresh Produce", href: "/marketplace?category=fresh-produce", image: "/images/products/sweet-oranges-1kg.jpg", imageAlt: "Fresh oranges" },
  { label: "Seafood", href: "/marketplace?q=seafood", image: "/images/products/seafood-market.jpg", imageAlt: "Fresh fish and seafood at a market" },
  { label: "Tubers", href: "/marketplace?q=tubers", image: "/images/products/yam-tubers.jpg", imageAlt: "Yam tubers" },
  { label: "Vegetables", href: "/marketplace?q=vegetables", image: "/images/products/fresh-pepper-mix-500g.jpg", imageAlt: "Fresh peppers and vegetables" },
  { label: "Phones and Accessories", href: "/marketplace?category=phones-accessories", image: "/images/products/samsung-galaxy-a06-128gb.jpg", imageAlt: "Android smartphone" },
  { label: "Provisions", href: "/marketplace?category=provisions", image: "/images/products/big-bull-rice-5kg.jpg", imageAlt: "Bag of rice" },
  { label: "Household & Personal Care", href: "/marketplace?q=household%20personal%20care", image: "/images/products/household-cleaning-products.jpg", imageAlt: "Household cleaning and personal care products" },
  { label: "Jewellery", href: "/marketplace?q=jewellery", image: "/images/products/jewelry-necklace.jpg", imageAlt: "Decorative necklace" },
  { label: "Freshly Baked Bread", href: "/marketplace?q=bread", image: "/images/products/freshly-baked-bread.jpg", imageAlt: "Freshly baked loaves of bread" },
];

export const landingSteps = [
  { number: "01", title: "Browse", description: "Explore products and shops from local Benin City vendors.", Icon: Search },
  { number: "02", title: "Order", description: "Choose what you need and place your order online.", Icon: ClipboardList },
  { number: "03", title: "Vendor prepares", description: "The vendor gets your items ready for delivery.", Icon: Store },
  { number: "04", title: "Delivered", description: "Your order is brought to your doorstep.", Icon: Truck },
];

export const trustPoints = [
  { title: "Verified vendors", description: "Shop with vendors approved for the OjaLink marketplace.", image: "/images/landing/nigerian-market-vendors-v2.jpg", imageAlt: "Three Nigerian market vendors: two women selling produce and a man selling yams" },
  { title: "Real Naira prices", description: "See product prices in Naira before you place an order.", image: "/images/landing/nigerian-naira-handheld-v2.jpg", imageAlt: "A hand holding folded Nigerian naira notes in close view" },
  { title: "Doorstep delivery", description: "Order from local markets and arrange delivery to your area.", image: "/images/landing/nigerian-helmeted-dispatch-rider.jpg", imageAlt: "A Nigerian dispatch rider wearing a helmet beside his motorcycle and delivery box" },
];

export const benefits = [
  { title: "Your market, online", description: "Find fresh food, fabrics, electronics, and daily provisions in one place." },
  { title: "Local shops in view", description: "Discover vendors connected to familiar Benin City markets." },
  { title: "Clear prices", description: "Compare listed products and prices before deciding what to buy." },
];

export const faqs = [
  { question: "Where does OjaLink deliver?", answer: "Choose a listed Benin City area at checkout: Ugbowo, Uselu, Ring Road, Sapele Road, GRA, New Benin, Oba Market, or Ikpoba Hill. The delivery fee is included in your order total." },
  { question: "How do I pay for an order?", answer: "Checkout uses Paystack test mode while the team is testing the service. Do not use a real payment card." },
  { question: "How can I check my order?", answer: "Sign in and open My orders to view your order details and status." },
  { question: "Can I return or report an item?", answer: "For help with an order, sign in and open My orders. Contact details for customer support will be added here." },
  { question: "How do I become a vendor?", answer: "Create an account and contact the OjaLink team to request vendor access. Vendor accounts require approval before selling." },
  { question: "When will a vendor be approved?", answer: "The OjaLink team reviews vendor applications. Approval is required before a shop and its products appear publicly." },
  { question: "What can I buy on OjaLink?", answer: "Browse fabrics, fresh produce, phones and accessories, and daily provisions listed by approved vendors." },
];

export const contactPlaceholders = {
  email: "[Support email to be added]",
  phone: "[Support phone to be added]",
  instagram: "[Instagram URL to be added]",
  facebook: "[Facebook URL to be added]",
};
