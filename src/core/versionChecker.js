import axios from 'axios';
import { TOOLS } from '../config/tools.js';
import * as cache from './cache.js';
import logger from './logger.js';

async function getLatestVersion(toolId) {
  const tool = TOOLS.find(t => t.id === toolId);
  if (!tool || !tool.latestVersionApi) return null;

  const cacheKey = `latest_version_${toolId}`;
  const cached = cache.getCache(cacheKey);
  if (cached) {
    logger.info(`Using cached latest version for ${toolId}: ${cached}`);
    return cached;
  }

  try {
    logger.info(`Fetching latest version for ${toolId} from API...`);
    const options = {
      timeout: 10_000,
      headers: {
        'User-Agent': 'DevPulse/1.0.0 (Windows)'
      }
    };
    if (tool.isTextApi) {
      options.responseType = 'text';
    }
    const response = await axios.get(tool.latestVersionApi, options);
    const data = response.data;
    const latestVersion = tool.parseLatest(data);
    
    if (latestVersion) {
      cache.setCache(cacheKey, latestVersion);
      return latestVersion;
    }
    return null;
  } catch (error) {
    logger.error(`Failed to fetch latest version for ${toolId}: ${error.message}`);
    return null;
  }
}

async function getAllLatestVersions() {
  const versions = {};
  for (const tool of TOOLS) {
    if (tool.latestVersionApi) {
      versions[tool.id] = await getLatestVersion(tool.id);
    } else {
      versions[tool.id] = null;
    }
  }
  return versions;
}

export { getLatestVersion, getAllLatestVersions };
