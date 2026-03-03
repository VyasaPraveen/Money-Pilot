'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-lg text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-600 mb-4 break-all">{error.message}</p>
        <pre className="text-xs text-left bg-slate-100 rounded-xl p-3 mb-4 overflow-auto max-h-40">
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="px-6 py-2 bg-violet-500 text-white rounded-xl font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
