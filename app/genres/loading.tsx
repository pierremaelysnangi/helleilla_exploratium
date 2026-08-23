export default function Loading() {
  return (
    <div className="container mx-auto animate-pulse px-4 py-8">
      <div className="bg-muted mb-4 h-8 w-48 rounded" />
      <div className="bg-muted mb-2 h-4 w-full rounded" />
      <div className="bg-muted h-4 w-3/4 rounded" />
    </div>
  );
}
