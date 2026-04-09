import { exec } from 'child_process';
import util from 'util';
import { TOOLS } from '../config/tools.js';
import logger from './logger.js';

const execAsync = util.promisify(exec);

async function checkToolStatus(tool) {
  try {
    const { stdout, stderr } = await execAsync(tool.detectCmd, { timeout: 5000 });
    const output = (stdout + ' ' + stderr).trim();
    const match = output.match(tool.versionRegex);
    
    if (match && match[1]) {
      return { installed: true, version: match[1] };
    } else {
      logger.warn(`Could not parse version for ${tool.id}. Output: ${output}`);
      // Fallback
      return { installed: true, version: 'Unknown' };
    }
  } catch (error) {
    logger.info(`${tool.id} not found or error executing: ${error.message}`);
    return { installed: false, version: null };
  }
}

async function scanSystem() {
  logger.info('Starting system scan for tools...');
  const results = {};
  for (const tool of TOOLS) {
    logger.info(`Checking ${tool.name}...`);
    // Progress message for renderer logs (sent by main process)
    results[tool.id] = await checkToolStatus(tool);
  }
  logger.info('System scan completed.');
  return results;
}

export { scanSystem, checkToolStatus };
