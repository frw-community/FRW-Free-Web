import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // IPFS operations
  ipfs: {
    check: () => ipcRenderer.invoke('ipfs:check')
  },
  
  // Name resolution
  name: {
    resolve: (name: string) => ipcRenderer.invoke('name:resolve', name)
  },
  
  // Verification
  verify: {
    page: (content: string, publicKey: string) => 
      ipcRenderer.invoke('verify:page', content, publicKey)
  },
  
  // Page metadata
  page: {
    getMetadata: (content: string) => ipcRenderer.invoke('page:metadata', content)
  }
});
