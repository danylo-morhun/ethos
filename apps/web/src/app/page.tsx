import { Button } from "@ethos/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ethos/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">ethos</CardTitle>
          <CardDescription>Personal finance app</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Connect your accounts to get started.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Connect</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
