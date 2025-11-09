import { useState, FormEvent } from 'react';

interface AddressBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
}

export default function AddressBar({ currentUrl, onNavigate }: AddressBarProps) {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    let url = inputValue.trim();
    
    // Add frw:// if missing
    if (!url.startsWith('frw://')) {
      url = `frw://${url}`;
    }
    
    onNavigate(url);
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-2">
      <div className={`flex items-center bg-gray-100 rounded-lg px-4 py-2 transition-all ${
        isFocused ? 'ring-2 ring-frw-primary' : ''
      }`}>
        <span className="text-gray-500 mr-2">🔒</span>
        <input
          type="text"
          value={isFocused ? inputValue : currentUrl}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setInputValue(currentUrl);
          }}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Enter frw:// URL or name..."
        />
        <button
          type="submit"
          className="ml-2 px-4 py-1 bg-frw-primary text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Go
        </button>
      </div>
    </form>
  );
}
