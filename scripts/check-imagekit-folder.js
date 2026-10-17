const auth = 'Basic ' + Buffer.from('private_hOECE/HeE+7R8xq8MW++vJEoyJU=:').toString('base64');

async function check() {
  const res = await fetch('https://api.imagekit.io/v1/files?searchQuery=' + encodeURIComponent('tags IN ["Badminton-shop"]'), {
    headers: { Authorization: auth }
  });
  const data = await res.json();
  console.log('Total files found with tag Badminton-shop:', data.length);
  if (data.length > 0) {
    console.log('Sample file:', {
      name: data[0].name,
      filePath: data[0].filePath,
      url: data[0].url
    });
  }
}

check().catch(console.error);
