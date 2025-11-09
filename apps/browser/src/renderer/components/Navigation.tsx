interface NavigationProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
}

export default function Navigation({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onReload
}: NavigationProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          !canGoBack ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        title="Back"
      >
        ←
      </button>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          !canGoForward ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        title="Forward"
      >
        →
      </button>
      <button
        onClick={onReload}
        className="p-2 rounded hover:bg-gray-100 transition-colors"
        title="Reload"
      >
        ↻
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-bold text-frw-primary">FRW</span>
        <span>Browser</span>
      </div>
    </div>
  );
}
