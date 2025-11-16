import { useEffect, useState } from 'react';
import VerificationBadge from './VerificationBadge';
import { queryName } from '../../config/bootstrap-renderer';

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
  const [cid, setCid] = useState<string>('');

  useEffect(() => {
    loadContent();
  }, [url]);

  async function loadContent() {
    setLoading(true);
    setError(null);
    
    try {
      const match = url.match(/^frw:\/\/([^\/]+)/);
      const name = match ? match[1] : null;
      
      if (name) {
        try {
          const data = await queryName(name);
          setMetadata({
            version: '1.0',
            author: data.publicKey ? `@${data.publicKey.substring(0, 8)}...` : undefined,
            date: data.timestamp ? new Date(data.timestamp).toISOString() : undefined
          });
          setVerified(!!data.publicKey);
          setCid(data.contentCID);

          setLoading(false);
          return;
        } catch (err) {
          console.error('Failed to fetch name metadata:', err);
        }
      }
      
      setMetadata(null);
      setVerified(false);
      setLoading(false);
      
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

  // Use IPFS gateway URL if we have CID
  const displayUrl = cid ? `http://localhost:8080/ipfs/${cid}/` : url;

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
        src={displayUrl}
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="FRW Content"
      />
    </div>
  );
}
