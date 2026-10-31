import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account · OjaLink",
  description:
    "Join OjaLink to buy from Benin City markets or sell from your own market stall.",
};

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
        Create your account
      </h1>
      <p className="mt-1 mb-4 text-base text-muted-foreground">
        New accounts are buyer accounts. Vendors are approved by an admin after
        you sign up.
      </p>
      <SignupForm />
    </div>
  );
}
