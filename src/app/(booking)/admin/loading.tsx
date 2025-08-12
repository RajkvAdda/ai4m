export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></span>
      <span className="text-lg font-semibold text-blue-500">Loading...</span>
    </div>
  );
}
