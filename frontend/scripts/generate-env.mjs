import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(rootDir, '.env');
const exampleEnvPath = resolve(rootDir, '.env.example');
const outputPath = resolve(rootDir, 'src', 'environments', 'environment.generated.ts');

const sourcePath = existsSync(envPath) ? envPath : exampleEnvPath;
const env = parse(readFileSync(sourcePath));

const requiredKeys = ['API_URL'];
const missingKeys = requiredKeys.filter((key) => !env[key]);

if (missingKeys.length > 0) {
  throw new Error(`Missing environment variables: ${missingKeys.join(', ')}`);
}

const file = `export const environment = {
  apiUrl: ${JSON.stringify(env['API_URL'])},
};
`;

writeFileSync(outputPath, file);
console.log(`Generated ${outputPath}`);
