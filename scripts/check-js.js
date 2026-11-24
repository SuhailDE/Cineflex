import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { transform } from 'esbuild';

const root = process.cwd();
const scanDirs = ['backend', 'src', 'scripts'];
const files = ['server.js', 'vite.config.js'];

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      files.push(full);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      throw new Error(`TypeScript file detected (${full}), but project must be JavaScript-only.`);
    }
  }
}

for (const dir of scanDirs) {
  collectFiles(path.join(root, dir));
}

for (const file of files) {
  const fullPath = path.isAbsolute(file) ? file : path.join(root, file);
  if (!fs.existsSync(fullPath)) continue;
  if (fullPath.endsWith('.js')) {
    execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' });
  } else if (fullPath.endsWith('.jsx')) {
    const code = fs.readFileSync(fullPath, 'utf8');
    await transform(code, { loader: 'jsx', jsx: 'automatic' });
  }
}

console.log(`Checked ${files.length} JavaScript/JSX files cleanly.`);
