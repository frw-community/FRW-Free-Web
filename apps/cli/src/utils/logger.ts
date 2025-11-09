import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  },

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  },

  warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  },

  debug(message: string): void {
    console.log(chalk.gray('→'), message);
  },

  section(title: string): void {
    console.log('\n' + chalk.bold.cyan(title));
    console.log(chalk.cyan('─'.repeat(title.length)));
  },

  code(text: string): string {
    return chalk.bgBlack.white(` ${text} `);
  },

  url(text: string): string {
    return chalk.cyan.underline(text);
  }
};
