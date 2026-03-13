// db/pool.js
const { Pool } = require('pg');

// Load environment variables
const {
  DB_USER = 'postgres',
  DB_HOST = 'localhost',
  DB_NAME = 'pakaian',
  DB_PASSWORD = 'postgres',
  DB_PORT = '5432',
  DATABASE_URL,
  NODE_ENV = 'development'
} = process.env;

let pool;
let poolConfig = {};

// Jika menggunakan DATABASE_URL (Supabase, Railway, dll)
if (DATABASE_URL) {
  console.log('🔗 Using DATABASE_URL connection');
  poolConfig = {
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Wajib untuk Supabase
    }
  };
} else {
  // Koneksi manual
  console.log('🔧 Using manual connection parameters');
  
  // Deteksi otomatis jenis koneksi
  const useSSL = DB_HOST && 
                 !DB_HOST.includes('localhost') && 
                 !DB_HOST.includes('127.0.0.1');

  poolConfig = {
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT),
  };

  // Tambahkan SSL hanya jika perlu (untuk remote connection)
  if (useSSL) {
    poolConfig.ssl = { rejectUnauthorized: false };
    console.log('🌐 Using SSL (remote connection)');
  } else {
    console.log('💻 No SSL (local connection)');
  }
}

// Log koneksi (tanpa password)
console.log('📊 Database config:', {
  host: poolConfig.host || (poolConfig.connectionString ? 'from connection string' : undefined),
  database: poolConfig.database || 'from connection string',
  user: poolConfig.user || 'from connection string',
  port: poolConfig.port || 'from connection string',
  ssl: !!poolConfig.ssl,
  connectionString: !!poolConfig.connectionString
});

// Buat pool koneksi
pool = new Pool(poolConfig);

// Test koneksi dengan event handler
pool.on('connect', (client) => {
  console.log('✅ Database pool connected');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected database pool error:', err.message);
});

// Fungsi untuk test koneksi
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection test successful');
    console.log(`🕐 Server time: ${result.rows[0].current_time}`);
    return true;
  } catch (err) {
    console.error('❌ Database connection test failed:');
    console.error('   Error code:', err.code);
    console.error('   Error message:', err.message);
    
    // Berikan solusi berdasarkan error
    if (err.code === '3D000') {
      console.error('\n🔧 SOLUSI: Database tidak ditemukan');
      console.error(`   Buat database dengan perintah: CREATE DATABASE ${DB_NAME};`);
    } else if (err.code === '28P01') {
      console.error('\n🔧 SOLUSI: Password salah');
      console.error('   Cek password di file .env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n🔧 SOLUSI: PostgreSQL tidak berjalan');
      console.error('   Windows: net start postgresql-x64-16');
      console.error('   Atau cek Services (services.msc)');
    } else if (err.message.includes('SSL')) {
      console.error('\n🔧 SOLUSI: SSL tidak didukung oleh server');
      console.error('   Untuk koneksi lokal, pastikan tidak menggunakan SSL');
      console.error('   Hapus opsi SSL di konfigurasi');
    }
    
    return false;
  } finally {
    if (client) client.release();
  }
};

// Jalankan test koneksi (async)
setTimeout(() => {
  testConnection().then(success => {
    if (!success) {
      console.log('\n⚠️  Server akan tetap berjalan tapi koneksi database bermasalah');
    }
  });
}, 100); // Delay kecil agar server bisa start dulu

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

module.exports = pool;