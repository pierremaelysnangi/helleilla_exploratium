"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-destructive">Une erreur est survenue</h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Réessayer
      </button>
    </div>
  );
}
