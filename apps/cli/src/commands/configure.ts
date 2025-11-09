import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';

interface SiteConfig {
  name: string;
  title: string;
  description?: string;
  author?: string;
  domain?: string;
  frwName?: string;
  buildDir?: string;
  files?: string[];
  createdAt: string;
  updatedAt: string;
}

export async function configureCommand(sitePath: string = '.'): Promise<void> {
  logger.section('Configure FRW Site');

  const configPath = path.join(sitePath, 'frw.config.json');
  const exists = existsSync(configPath);

  let config: SiteConfig | null = null;

  // Load existing config if available
  if (exists) {
    try {
      const content = await readFile(configPath, 'utf-8');
      config = JSON.parse(content);
      logger.info(`Found existing configuration: ${configPath}`);
      logger.info('');
    } catch (error) {
      logger.warn('Could not read existing config, creating new one');
    }
  }

  // Prompt for configuration
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Site identifier (lowercase, no spaces):',
      default: config?.name || path.basename(path.resolve(sitePath)),
      validate: (input: string) => {
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Name must be lowercase letters, numbers, and hyphens only';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'title',
      message: 'Site title:',
      default: config?.title || 'My FRW Site'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
      default: config?.description || ''
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author (optional):',
      default: config?.author || ''
    },
    {
      type: 'input',
      name: 'domain',
      message: 'Custom domain (optional, e.g., example.com):',
      default: config?.domain || '',
      validate: (input: string) => {
        if (!input) return true;
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
        if (!domainRegex.test(input.toLowerCase())) {
          return 'Invalid domain format';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'frwName',
      message: 'FRW name (registered name):',
      default: config?.frwName || '',
      validate: (input: string) => {
        if (!input) return 'FRW name is required';
        const nameRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
        if (!nameRegex.test(input)) {
          return 'Invalid FRW name format (3-63 chars, lowercase, alphanumeric + hyphens)';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'buildDir',
      message: 'Build directory (relative path):',
      default: config?.buildDir || '.'
    }
  ]);

  // Create site configuration
  const siteConfig: SiteConfig = {
    name: answers.name,
    title: answers.title,
    description: answers.description || undefined,
    author: answers.author || undefined,
    domain: answers.domain || undefined,
    frwName: answers.frwName,
    buildDir: answers.buildDir || '.',
    createdAt: config?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save configuration
  try {
    await writeFile(configPath, JSON.stringify(siteConfig, null, 2), 'utf-8');
    logger.success(`Configuration saved: ${configPath}`);
    logger.info('');

    // Display configuration
    logger.section('Site Configuration');
    logger.info('Name:        ' + logger.code(siteConfig.name));
    logger.info('Title:       ' + siteConfig.title);
    if (siteConfig.description) {
      logger.info('Description: ' + siteConfig.description);
    }
    if (siteConfig.author) {
      logger.info('Author:      ' + siteConfig.author);
    }
    if (siteConfig.domain) {
      logger.info('Domain:      ' + logger.url(`https://${siteConfig.domain}`));
    }
    logger.info('FRW Name:    ' + logger.code(`frw://${siteConfig.frwName}/`));
    logger.info('Build Dir:   ' + siteConfig.buildDir);
    logger.info('');

    // Next steps
    logger.section('Next Steps');
    
    if (siteConfig.domain) {
      logger.info('1. Link domain to FRW:');
      logger.info('   ' + logger.code(`frw domain add ${siteConfig.domain} ${siteConfig.frwName}`));
      logger.info('');
      logger.info('2. Add DNS TXT record for your domain');
      logger.info('');
    }

    logger.info(`${siteConfig.domain ? '3' : '1'}. Publish your site:`);
    logger.info('   ' + logger.code(`frw publish ${sitePath}`));

  } catch (error) {
    logger.error('Failed to save configuration');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function configShowCommand(sitePath: string = '.'): Promise<void> {
  const configPath = path.join(sitePath, 'frw.config.json');

  if (!existsSync(configPath)) {
    logger.error('No configuration found');
    logger.info('Create one with: ' + logger.code(`frw configure ${sitePath}`));
    process.exit(1);
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const config: SiteConfig = JSON.parse(content);

    logger.section('Site Configuration');
    logger.info('');
    logger.info('Name:        ' + logger.code(config.name));
    logger.info('Title:       ' + config.title);
    if (config.description) {
      logger.info('Description: ' + config.description);
    }
    if (config.author) {
      logger.info('Author:      ' + config.author);
    }
    if (config.domain) {
      logger.info('Domain:      ' + logger.url(`https://${config.domain}`));
    }
    logger.info('FRW Name:    ' + logger.code(`frw://${config.frwName}/`));
    logger.info('Build Dir:   ' + config.buildDir);
    logger.info('');
    logger.info('Created:     ' + new Date(config.createdAt).toLocaleString());
    logger.info('Updated:     ' + new Date(config.updatedAt).toLocaleString());

  } catch (error) {
    logger.error('Failed to read configuration');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function loadSiteConfig(sitePath: string): Promise<SiteConfig | null> {
  const configPath = path.join(sitePath, 'frw.config.json');
  
  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}
