const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/exports/reports?type=USERS&format=excel',
  method: 'GET',
  headers: {
    // we need auth token, let's just make it return error and see
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', console.error);
req.end();
