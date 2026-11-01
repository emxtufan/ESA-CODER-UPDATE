/** Rută inexistentă. */
import { Link } from "react-router";

import { Card } from "@/components/ui";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm" title="Pagina nu a fost găsită">
        <p className="text-sm text-muted">Adresa cerută nu există sau a fost mutată.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Înapoi la Dashboard
        </Link>
      </Card>
    </div>
  );
}

export default NotFound;
