/**
 * Start script for LLM LoreSmith backend
 * 
 * This script checks if PostgreSQL is running and then starts the application
 */
const { execSync } = require('child_process');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Determine OS-specific commands
const isWindows = os.platform() === 'win32';
const pgStatusCommand = isWindows 
  ? 'sc query postgresql'
  : 'pg_isready';

// Function to check if PostgreSQL is running
const checkPostgresRunning = () => {
  try {
    if (isWindows) {
      // On Windows, check the service status
      const output = execSync(pgStatusCommand, { encoding: 'utf8' });
      return output.includes('RUNNING');
    } else {
      // On Linux/Mac, use pg_isready
      execSync(pgStatusCommand);
      return true;
    }
  } catch (error) {
    console.error('PostgreSQL is not running or not installed.');
    console.error('Please make sure PostgreSQL is installed and running before starting the application.');
    
    if (isWindows) {
      console.error('\nTo start PostgreSQL on Windows:');
      console.error('1. Open Services (services.msc)');
      console.error('2. Find the PostgreSQL service');
      console.error('3. Right-click and select "Start"');
    } else {
      console.error('\nTo start PostgreSQL on Linux:');
      console.error('sudo service postgresql start');
      console.error('\nTo start PostgreSQL on Mac:');
      console.error('brew services start postgresql');
    }
    
    return false;
  }
};

// Function to ensure .env file exists
const ensureEnvFile = () => {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('.env file created successfully.');
  }
};

// Function to start the application
const startApp = () => {
  console.log('Starting LLM LoreSmith backend...');
  
  const isDev = process.argv.includes('--dev');
  const scriptName = isDev ? 'dev:with-db' : 'start:with-db';
  
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', scriptName], { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`Application exited with code ${code}`);
      process.exit(code);
    }
  });
};

// Main function
const main = () => {
  // Ensure .env file exists
  ensureEnvFile();
  
  // Check if PostgreSQL is running
  if (checkPostgresRunning()) {
    // Start the application
    startApp();
  } else {
    process.exit(1);
  }
};

// Run the main function
main(); 