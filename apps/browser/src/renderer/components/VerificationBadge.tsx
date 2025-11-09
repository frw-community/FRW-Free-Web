interface VerificationBadgeProps {
  verified: boolean;
  author?: string;
  date?: string;
}

export default function VerificationBadge({ verified, author, date }: VerificationBadgeProps) {
  return (
    <div className={`px-4 py-2 border-b flex items-center gap-3 ${
      verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      <span className="text-lg">
        {verified ? '✓' : '⚠'}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${verified ? 'text-green-700' : 'text-yellow-700'}`}>
            {verified ? 'Verified' : 'Unverified'}
          </span>
          {author && (
            <span className="text-sm text-gray-600">{author}</span>
          )}
        </div>
        {date && (
          <div className="text-xs text-gray-500">
            Published: {new Date(date).toLocaleDateString()}
          </div>
        )}
      </div>
      {verified && (
        <div className="text-xs text-green-600 font-medium">
          🔒 Secure
        </div>
      )}
    </div>
  );
}
