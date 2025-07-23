#!/usr/bin/env node

import { spawn } from 'child_process';

let serverProcess;
let viteProcess;

function startServer() {
  console.log('🚀 Starting API server...');
  serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
}

function startVite() {
  console.log('⚡ Starting Vite...');
  viteProcess = spawn('npx', ['vite', '--port', '5173', '--host'], {
    stdio: 'inherit', 
    cwd: process.cwd()
  });
}

// Start server first
startServer();

// Wait 3 seconds then start Vite
setTimeout(() => {
  startVite();
}, 3000);