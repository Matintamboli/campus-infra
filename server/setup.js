import { startPostgres, stopPostgres } from './initPostgres.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setup() {
  try {
    console.log('='.repeat(60));
    console.log('CampusFix Database Setup');
    console.log('='.repeat(60));

    // Step 1: Start PostgreSQL
    await startPostgres();

    // Wait a moment for PostgreSQL to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Run migrations
    console.log('\n[Setup] Running Prisma migrations...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate dev --name initial_setup');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      // Check if migration already exists
      if (error.message.includes('already exists') || error.message.includes('No changes')) {
        console.log('[Setup] Migrations already applied or no changes detected');
      } else {
        throw error;
      }
    }

    // Step 3: Generate Prisma Client
    console.log('\n[Setup] Generating Prisma Client...');
    const { stdout: genStdout } = await execAsync('npx prisma generate');
    console.log(genStdout);

    // Step 4: Seed database
    console.log('\n[Setup] Seeding database...');
    const { stdout: seedStdout } = await execAsync('node prisma/seed.js');
    console.log(seedStdout);

    console.log('\n' + '='.repeat(60));
    console.log('✓ Setup completed successfully!');
    console.log('='.repeat(60));
    console.log('\nPostgreSQL is running. You can now start the server with:');
    console.log('  npm run dev');
    console.log('\n');

  } catch (error) {
    console.error('\n[Setup Error]:', error.message);
    console.error('\nSetup failed. Please check the error above.');
    await stopPostgres();
    process.exit(1);
  }
}

setup();
