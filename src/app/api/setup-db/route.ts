import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Create database directory and file if it doesn't exist
    await execAsync('mkdir -p /tmp && touch /tmp/dev.db');
    
    // Set DATABASE_URL to use the temp file
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
    
    // Run Prisma migrations
    await execAsync('npx prisma migrate deploy');
    
    // Seed the database
    await execAsync('npx tsx prisma/seed.ts');
    
    return NextResponse.json({ message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ error: 'Database setup failed' }, { status: 500 });
  }
}
