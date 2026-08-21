export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-4" />
      <div className="h-4 w-full bg-muted rounded mb-2" />
      <div className="h-4 w-3/4 bg-muted rounded" />
    </div>
  );
}
