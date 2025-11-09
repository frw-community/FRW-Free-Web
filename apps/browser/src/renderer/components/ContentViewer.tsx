import { useEffect, useState } from 'react';
import VerificationBadge from './VerificationBadge';

interface ContentViewerProps {
  url: string;
}

interface PageMetadata {
  version?: string;
  author?: string;
  date?: string;
  signature?: string;
}

export default function ContentViewer({ url }: ContentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PageMetadata | null>(null);
  const [verified, setVerified] = useState<boolean>(false);

  useEffect(() => {
    loadContent();
  }, [url]);

  async function loadContent() {
    setLoading(true);
    setError(null);
    
    try {
      // The content will be loaded via the frw:// protocol handler
      // Here we just need to update the iframe src
      
      // For now, show loading state
      setTimeout(() => {
        setLoading(false);
        // Mock metadata for demo
        setMetadata({
          version: '1.0',
          author: '@alice',
          date: new Date().toISOString()
        });
        setVerified(true);
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">↻</div>
          <p className="text-gray-600">Loading {url}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Failed to Load</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadContent}
            className="px-4 py-2 bg-frw-primary text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {metadata && (
        <VerificationBadge
          verified={verified}
          author={metadata.author}
          date={metadata.date}
        />
      )}
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="FRW Content"
      />
    </div>
  );
}
