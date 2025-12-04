
const fetch = require('node-fetch');

const BOOTSTRAP_NODES = [
  "http://[2001:1600:18:102::165]:3100",
  "http://83.228.214.189:3100",
  "http://83.228.213.45:3100",
  "http://83.228.213.240:3100",
  "http://83.228.214.72:3100",
  "http://165.73.244.107:3100",
  "http://165.73.244.74:3100",
  "http://155.117.46.244:3100",
  "http://217.216.32.99:3100"
];

async function checkNodes() {
  console.log('Checking Bootstrap Nodes Health & Version...\n');
  
  for (const node of BOOTSTRAP_NODES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout
      
      const start = Date.now();
      const res = await fetch(`${node}/health`, { signal: controller.signal });
      const data = await res.json();
      const latency = Date.now() - start;
      
      clearTimeout(timeout);

      const isV2 = data.v2IndexSize !== undefined;
      const status = res.ok ? '✅ OK' : '❌ Error';
      
      console.log(`${status.padEnd(8)} ${node}`);
      console.log(`   Latency: ${latency}ms`);
      console.log(`   NodeID:  ${data.nodeId}`);
      console.log(`   Records: V1=${data.v1IndexSize || 0}, V2=${data.v2IndexSize || 0}`);
      console.log(`   Uptime:  ${Math.floor(data.uptime)}s`);
      console.log('');
      
    } catch (err) {
      console.log(`❌ DOWN  ${node}`);
      console.log(`   Error: ${err.message}\n`);
    }
  }
}

checkNodes();
