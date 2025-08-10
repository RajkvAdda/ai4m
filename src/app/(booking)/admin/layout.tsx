import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col p-8">
      <main className="flex-1">
        <div className="container py-8">
          <Alert className="mb-8 border-primary/50 bg-primary/5 text-primary">
            <AlertCircle className="h-4 w-4 !text-primary" />
            <AlertTitle>Admin Panel</AlertTitle>
            <AlertDescription>
              You have administrative privileges. Changes made here will affect
              all users.
            </AlertDescription>
          </Alert>
          {children}
        </div>
      </main>
    </div>
  );
}
