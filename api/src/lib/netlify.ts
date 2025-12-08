/**
 * Netlify build hook client
 */

import { config } from '../config.ts';

export async function triggerBuild(): Promise<boolean> {
  const response = await fetch(config.netlify.buildHookUrl, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Netlify webhook failed: ${response.statusText}`);
  }

  return true;
}
