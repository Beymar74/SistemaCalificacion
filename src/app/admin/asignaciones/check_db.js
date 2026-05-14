
const fs = require('fs');
const path = require('path');

// Leer .env manualmente
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  const key = parts[0]?.trim();
  const value = parts.slice(1).join('=')?.trim().replace(/^"|"$/g, '');
  if (key && value) env[key] = value;
});

async function check() {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/asignaciones?select=*&limit=5`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('SAMPLE_DATA:', data);
    if (data.length > 0) {
      console.log('COLUMNS:', Object.keys(data[0]));
    } else {
      console.log('TABLE IS EMPTY');
    }

    const countRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/asignaciones?select=count`, {
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    console.log('COUNT_STATUS:', countRes.status);
    console.log('COUNT_RANGE:', countRes.headers.get('content-range'));

  } catch (err) {
    console.error('FETCH_ERROR:', err.message);
  }
}

check();
