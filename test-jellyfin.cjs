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
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body || '{}'));
          } else {
            resolve({ error: res.statusCode, body });
          }
        } catch (e) {
          resolve({ error: 'Parse', body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

(async () => {
  try {
    const auth = await request('/Users/AuthenticateByName', 'POST', { Username: 'Movixy', Pw: '' });
    if (auth.error) {
      console.log('Auth failed:', auth);
      return;
    }
    const token = auth.AccessToken;
    const userId = auth.User.Id;
    
    const items = await request(`/Users/${userId}/Items?IncludeItemTypes=Series,Folder&Recursive=true`);
    console.log('Series/Folders:', items.Items.map(i => ({ Name: i.Name, Type: i.Type, Id: i.Id })));
    
    const series = items.Items.find(i => i.Name.includes('Dragon'));
    if (series) {
      const children = await request(`/Users/${userId}/Items?ParentId=${series.Id}&Recursive=true`);
      console.log(`Children of ${series.Name}:`, children.Items.map(i => ({ Name: i.Name, Type: i.Type, Id: i.Id })));
    } else {
      console.log('Dragon series not found');
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();
