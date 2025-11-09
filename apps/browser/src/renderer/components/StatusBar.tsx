import { useEffect, useState } from 'react';

export default function StatusBar() {
  const [ipfsConnected, setIpfsConnected] = useState(false);

  useEffect(() => {
    checkIPFS();
  }, []);

  async function checkIPFS() {
    try {
      const result = await (window as any).electronAPI.ipfs.check();
      setIpfsConnected(result.connected);
    } catch {
      setIpfsConnected(false);
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-1 flex items-center justify-between text-xs text-gray-600">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${ipfsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>IPFS {ipfsConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      <div>
        FRW Browser v1.0.0
      </div>
    </div>
  );
}
