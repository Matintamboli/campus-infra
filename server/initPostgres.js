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
    });

    await embeddedPostgres.initialise();
    await embeddedPostgres.start();

    console.log('[PostgreSQL] ✓ PostgreSQL server started successfully on port 5432');
    console.log('[PostgreSQL] Database: campusfix');
    return embeddedPostgres;
  } catch (error) {
    console.error('[PostgreSQL] Failed to start:', error.message);
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
