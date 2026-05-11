import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const distDir = resolve(root, 'dist');
const pluginAssetsDir = resolve(root, 'wordpress', 'trulle-portal-elementor', 'assets');

if (!existsSync(distDir)) {
  throw new Error('dist directory not found. Run build first.');
}

mkdirSync(pluginAssetsDir, { recursive: true });

cpSync(resolve(distDir, 'portal-nav.iife.js'), resolve(pluginAssetsDir, 'portal-nav.iife.js'));
cpSync(resolve(distDir, 'portal-nav.css'), resolve(pluginAssetsDir, 'portal-nav.css'));

console.log('Copied portal assets to WordPress plugin assets directory.');
