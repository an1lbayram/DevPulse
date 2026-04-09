import { exec } from 'child_process';
import os from 'os';
import logger from './logger.js';

const ALLOWED_COMMANDS = new Map([
  ['winget', [['upgrade'], ['install']]],
  ['npm', [['install']]],
  ['yarn', [['global', 'add']]],
  ['python', [['-m', 'pip', 'install']]],
  ['choco', [['upgrade'], ['install']]]
]);

// Check if running on Windows
const isWindows = os.platform() === 'win32';

// Basic command injection prevention
function validateCommand(cmdString) {
  if (!cmdString) return false;
  
  if (!isWindows) {
    logger.warn(`Security Blocked: Non-Windows platform is not supported for command execution: ${cmdString}`);
    return false;
  }

  // No shell piping or chaining allowed
  if (/[&|;<>$`]/.test(cmdString)) {
    logger.warn(`Security Blocked: Invalid characters in command: ${cmdString}`);
    return false;
  }

  const parts = cmdString.split(' ').filter(p => p.trim() !== '');
  const baseCmd = parts[0];
  
  if (!ALLOWED_COMMANDS.has(baseCmd)) {
    logger.warn(`Security Blocked: Command '${baseCmd}' is not whitelisted.`);
    return false;
  }

  return validateCommandParts(baseCmd, parts.slice(1));
}

function validateCommandParts(cmd, args = []) {
  if (!cmd) return false;

  if (!isWindows) {
    logger.warn(`Security Blocked: Non-Windows platform is not supported for command execution: ${cmd}`);
    return false;
  }

  if (!ALLOWED_COMMANDS.has(cmd)) {
    logger.warn(`Security Blocked: Command '${cmd}' is not whitelisted.`);
    return false;
  }

  const allowedPatterns = ALLOWED_COMMANDS.get(cmd);
  const argParts = (args || []).map(String);
  const matchesPattern = allowedPatterns.some((patternParts) => {
    if (argParts.length < patternParts.length) return false;
    for (let i = 0; i < patternParts.length; i++) {
      if (argParts[i] !== patternParts[i]) return false;
    }
    return true;
  });

  if (!matchesPattern) {
    logger.warn(`Security Blocked: Args not allowed for '${cmd}'. Args: ${argParts.join(' ')}`);
    return false;
  }

  return true;
}

// Function to handle the admin/UAC elevation check
async function isRunningAsAdmin() {
  return new Promise((resolve) => {
    exec('net session', (err) => {
      resolve(!err);
    });
  });
}

export { validateCommand, validateCommandParts, isRunningAsAdmin };
