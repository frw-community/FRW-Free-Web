import { useState } from 'react';
import AddressBar from './components/AddressBar';
import Navigation from './components/Navigation';
import ContentViewer from './components/ContentViewer';
import StatusBar from './components/StatusBar';

export default function App() {
  const [currentUrl, setCurrentUrl] = useState('frw://alice/');
  const [history, setHistory] = useState<string[]>(['frw://alice/']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigate = (url: string) => {
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentUrl(url);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentUrl(history[historyIndex - 1]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentUrl(history[historyIndex + 1]);
    }
  };

  const reload = () => {
    setCurrentUrl(currentUrl + '?reload=' + Date.now());
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <Navigation
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          onBack={goBack}
          onForward={goForward}
          onReload={reload}
        />
        <AddressBar currentUrl={currentUrl} onNavigate={navigate} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ContentViewer url={currentUrl} />
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
