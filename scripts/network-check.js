
const nodes = [
  "217.216.32.99",
  "83.228.213.240",
  "83.228.213.45",
  "83.228.214.189",
  "155.117.46.244",
  "165.73.244.107",
  "165.73.244.74"
];

async function checkNode(ip) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`http://${ip}:3100/api/resolve/pussycat`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.version === 2) {
        return { status: 'OK', ip };
      } else {
        return { status: 'OLD_VERSION', ip };
      }
    } else {
      if (response.status === 404) {
        // Check if it's running V2 code by hitting stats
        const statsRes = await fetch(`http://${ip}:3100/api/stats`);
        if (statsRes.ok) {
             return { status: 'MISSING_RECORD', ip };
        }
      }
      return { status: 'ERROR', ip, code: response.status };
    }
  } catch (error) {
    return { status: 'OFFLINE', ip, error: error.message };
  }
}

async function run() {
  console.log('Checking FRW Network Status...\n');
  console.log('IP Address\t\tStatus\t\tDetails');
  console.log('--------------------------------------------------------');
  
  const promises = nodes.map(checkNode);
  const results = await Promise.all(promises);
  
  results.forEach(r => {
    let statusIcon = '❌';
    let details = '';
    
    if (r.status === 'OK') {
        statusIcon = '✅';
        details = 'V2 Synced & Ready';
    } else if (r.status === 'MISSING_RECORD') {
        statusIcon = '⚠️';
        details = 'Online but Missing Record';
    } else if (r.status === 'OFFLINE') {
        statusIcon = '❌';
        details = 'Unreachable';
    } else {
        statusIcon = '❓';
        details = `Error: ${r.code}`;
    }
    
    console.log(`${r.ip}\t\t${statusIcon} ${r.status}\t${details}`);
  });
}

run();
