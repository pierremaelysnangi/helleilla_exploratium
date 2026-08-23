import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold">404 — Page introuvable</h2>
      <p className="text-muted-foreground mt-2">
        Cette page n&apos;existe pas ou plus.
      </p>
      <Link href="/" className="text-primary mt-4 inline-block underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
