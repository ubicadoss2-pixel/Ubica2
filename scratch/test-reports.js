const login = async () => {
  const res = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ubica2.com', password: '12345678' })
  });
  if (!res.ok) {
    throw new Error('Login failed: ' + res.statusText);
  }
  const data = await res.json();
  return data.accessToken;
};

const run = async () => {
  try {
    const token = await login();
    console.log('Logged in successfully. Token:', token.substring(0, 15) + '...');
    
    const res = await fetch('http://127.0.0.1:3000/api/admin/exports/reports?type=USERS&format=excel', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Request Status:', res.status, res.statusText);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      console.log('Success! Excel file size:', buffer.byteLength, 'bytes');
    } else {
      const text = await res.text();
      console.log('Error payload:', text);
    }
    
    const resPdf = await fetch('http://127.0.0.1:3000/api/admin/exports/reports?type=USERS&format=pdf', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('PDF Request Status:', resPdf.status, resPdf.statusText);
    if (resPdf.ok) {
      const buffer = await resPdf.arrayBuffer();
      console.log('Success! PDF file size:', buffer.byteLength, 'bytes');
    } else {
      const text = await resPdf.text();
      console.log('PDF Error payload:', text);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
};

run();
