const axios = require('axios');

// Get token from localStorage or use test token
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OGJjZTI3YzBhMGU4MDAxMjM0NTY3OCIsImlhdCI6MTczODMyMzU2M30.test';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
  }
});

async function testAPI() {
  try {
    console.log('🔍 Testing Rekening API endpoints...\n');

    // Test 1: Fetch all rekening details
    console.log('1️⃣ GET /api/rekening (all rekeninga)');
    try {
      const res1 = await api.get('/api/rekening');
      console.log('✅ Response:', JSON.stringify(res1.data, null, 2));
    } catch (err) {
      console.log('❌ Error:', err.response?.data || err.message);
    }

    console.log('\n---\n');

    // Test 2: Fetch Rekening A detail
    console.log('2️⃣ GET /api/rekening/account/Rekening%20A');
    try {
      const res2 = await api.get('/api/rekening/account/Rekening A');
      console.log('✅ Response:', JSON.stringify(res2.data, null, 2));
    } catch (err) {
      console.log('❌ Status:', err.response?.status);
      console.log('❌ Error:', err.response?.data || err.message);
    }

    console.log('\n---\n');

    // Test 3: Create new Rekening A detail
    console.log('3️⃣ POST /api/rekening (create Rekening A)');
    try {
      const res3 = await api.post('/api/rekening', {
        account: 'Rekening A',
        namaBank: 'Bank Mandiri',
        nomorRekening: '123456789',
        namaPemilik: 'PT. Test',
        cabang: 'Jakarta',
        saldoAwal: 1000000,
        status: 'aktif',
        tipeRekening: 'tabungan',
        mata_uang: 'IDR'
      });
      console.log('✅ Response:', JSON.stringify(res3.data, null, 2));
    } catch (err) {
      console.log('❌ Status:', err.response?.status);
      console.log('❌ Error:', err.response?.data || err.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI();
