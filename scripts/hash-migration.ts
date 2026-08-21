import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { readdirSync } from 'fs';

const dir = 'db/migrations';
const files = readdirSync(dir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const content = readFileSync(`${dir}/${file}`, 'utf-8');
  const hash = createHash('sha256').update(content).digest('hex');
  console.log(file, '->', hash);
}
