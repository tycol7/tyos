/**
 * Netlify deploy trigger endpoint
 */

import { Hono } from 'hono';
import { config } from '../config.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { ValidationError } from '../middleware/error.ts';

const deployRouter = new Hono();

deployRouter.use('*', authMiddleware);

// POST /deploy/preview - Trigger a preview deploy via GitHub Actions
deployRouter.post('/preview', async (c) => {
  try {
    // Trigger workflow dispatch
    const response = await fetch(
      `https://api.github.com/repos/${config.github.repoOwner}/${config.github.repoName}/actions/workflows/netlify.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${config.github.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'tyos-admin',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            deploy_type: 'preview',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return c.json({
      success: true,
      message: 'Preview deploy triggered successfully',
      preview_url: 'https://preview--your-site.netlify.app', // Update with actual site
    });
  } catch (error) {
    console.error('Failed to trigger deploy:', error);
    throw new ValidationError(
      `Failed to trigger deploy: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// POST /deploy/production - Trigger a production deploy via GitHub Actions
deployRouter.post('/production', async (c) => {
  try {
    // Trigger workflow dispatch
    const response = await fetch(
      `https://api.github.com/repos/${config.github.repoOwner}/${config.github.repoName}/actions/workflows/netlify.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${config.github.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'tyos-admin',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            deploy_type: 'production',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return c.json({
      success: true,
      message: 'Production deploy triggered successfully',
    });
  } catch (error) {
    console.error('Failed to trigger deploy:', error);
    throw new ValidationError(
      `Failed to trigger deploy: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export default deployRouter;
