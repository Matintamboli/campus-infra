import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, '.pgdata');

let embeddedPostgres;

export async function startPostgres() {
  try {
    console.log('[PostgreSQL] Starting embedded PostgreSQL server...');
    console.log('[PostgreSQL] Data directory:', dataDir);
    
    embeddedPostgres = new EmbeddedPostgres({
      databaseDir: dataDir,
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'campusfix',
      persistent: true, // Use existing data directory if present
    });

    // Only initialize if directory doesn't exist or is empty
    const fs = await import('fs');
    const dirExists = fs.existsSync(dataDir);
    const isEmpty = !dirExists || fs.readdirSync(dataDir).length === 0;

    if (isEmpty) {
      console.log('[PostgreSQL] Initializing new database cluster...');
      await embeddedPostgres.initialise();
    } else {
      console.log('[PostgreSQL] Using existing database cluster...');
    }

    await embeddedPostgres.start();

    console.log('[PostgreSQL] ✓ PostgreSQL server started successfully on port 5432');
    console.log('[PostgreSQL] Database: campusfix');
    return embeddedPostgres;
  } catch (error) {
    // PostgreSQL might already be running
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('lock file') || errorMsg.includes('postmaster.pid')) {
      console.log('[PostgreSQL] PostgreSQL appears to be already running');
      console.log('[PostgreSQL] Continuing with existing instance...');
      return null;
    }
    console.error('[PostgreSQL] Failed to start:', errorMsg);
    throw error;
  }
}

export async function stopPostgres() {
  if (embeddedPostgres) {
    try {
      console.log('[PostgreSQL] Stopping PostgreSQL server...');
      await embeddedPostgres.stop();
      console.log('[PostgreSQL] ✓ PostgreSQL server stopped');
    } catch (error) {
      console.error('[PostgreSQL] Error stopping:', error.message);
    }
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  await stopPostgres();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopPostgres();
  process.exit(0);
});
