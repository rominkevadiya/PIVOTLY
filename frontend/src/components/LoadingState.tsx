interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-ink/10 bg-white px-4 py-3 text-sm text-ink shadow-panel">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-moss border-t-transparent" />
      <span>{message}</span>
    </div>
  );
}
