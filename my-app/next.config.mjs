/**
 * Next.js configuration file.
 * This file is where project-specific app settings can be added, such as routing, image handling, and build behavior.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin the Turbopack root to this app. Without this, Next.js finds the
  // package-lock.json in the repository root and treats that as the workspace
  // root, which mixes up the .next cache locations.
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
