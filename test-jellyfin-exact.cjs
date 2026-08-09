const http = require('http');

const request = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8096,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': 'MediaBrowser Client="Test", Device="Test", DeviceId="123", Version="1.0"'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body || '{}')));
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

(async () => {
  // First, find the userId without auth (or use generic API key if needed)
  // Wait, I can just use the Admin token from the DB or create one!
  // I will just use the sqlite db to get an API key!
})();
