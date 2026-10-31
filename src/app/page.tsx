import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-[28px] font-bold text-primary">OjaLink</CardTitle>
        </CardHeader>
      </Card>
    </main>
  );
}
