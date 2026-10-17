async function test() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Badminton@2026' })
    });
    console.log('1. Login status:', loginRes.status);
    const cookie = loginRes.headers.get('set-cookie');
    const loginData = await loginRes.json();
    console.log('   User:', loginData.user?.username, '| Role:', loginData.user?.role);

    const logsRes = await fetch('http://localhost:3000/api/admin/logs?limit=5', {
      headers: { 'Cookie': cookie || '' }
    });
    console.log('2. Logs API status:', logsRes.status);
    const logsData = await logsRes.json();
    console.log('   Total records in DB:', logsData.pagination?.total);
    console.log('   KPI Stats:', JSON.stringify(logsData.stats, null, 2));
    console.log('3. Top logs retrieved:');
    (logsData.logs || []).forEach(l => {
      console.log(`   - [${l.timestamp}] [${l.level}] [${l.module}] ${l.action}: ${l.message} (Actor: ${l.actor_name})`);
    });
  } catch (err) {
    console.error('Error during test:', err);
  }
}

test();
