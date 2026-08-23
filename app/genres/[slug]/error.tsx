"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-destructive text-xl font-bold">
        Une erreur est survenue
      </h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground mt-4 rounded px-4 py-2"
      >
        Réessayer
      </button>
    </div>
  );
}
