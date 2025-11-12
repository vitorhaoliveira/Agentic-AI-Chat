import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Determine the correct path for .env file
// When running from monorepo root, we need to look in apps/api/.env
// When running from apps/api, we look in ./.env
const cwd = process.cwd();
const isInApiDir = cwd.endsWith('apps/api') || cwd.endsWith('apps\\api');
const apiDir = isInApiDir ? cwd : resolve(cwd, 'apps/api');
const envPath = resolve(apiDir, '.env');

// Try loading from api directory first
let loaded = false;
if (existsSync(envPath)) {
  const result = config({ path: envPath });
  if (!result.error) {
    loaded = true;
  }
}

// Also try loading from current directory (if different)
if (!loaded) {
  const currentEnvPath = resolve(cwd, '.env');
  if (existsSync(currentEnvPath)) {
    const result = config({ path: currentEnvPath });
    if (!result.error) {
      loaded = true;
    }
  }
}

// Try loading from parent directory (monorepo root)
if (!loaded) {
  const rootEnvPath = resolve(cwd, '../.env');
  if (existsSync(rootEnvPath)) {
    const result = config({ path: rootEnvPath });
    if (!result.error) {
      loaded = true;
    }
  }
}

// Export a function to verify env is loaded (for debugging)
export function verifyEnvLoaded(): void {
  const hasKey = !!process.env.OPENAI_API_KEY;
  
  if (!hasKey) {
    console.warn('\n⚠️  WARNING: OPENAI_API_KEY not found in environment');
    console.warn(`   Current working directory: ${cwd}`);
    console.warn(`   API directory: ${apiDir}`);
    console.warn(`   Tried loading from: ${envPath}`);
    console.warn(`   File exists: ${existsSync(envPath)}`);
    
    if (existsSync(envPath)) {
      console.warn(`   ✅ .env file found at: ${envPath}`);
      console.warn(`   ⚠️  But OPENAI_API_KEY is not set in the file`);
    } else {
      console.warn(`   ❌ .env file not found at: ${envPath}`);
      console.warn(`   💡 Create a .env file in apps/api/ with:`);
      console.warn(`      OPENAI_API_KEY=your_api_key_here`);
    }
    console.warn('');
  }
}

