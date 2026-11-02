import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VendorNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-bold">Shop not found</CardTitle>
          <CardDescription>
            This shop link may be incorrect, or the vendor may not be approved yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/vendors">Browse vendor shops</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
