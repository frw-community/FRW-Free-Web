import chalk from 'chalk';

export async function lookupCommand(name: string): Promise<void> {
  console.log(chalk.yellow(`Looking up name: ${name}`));
  console.log(chalk.red('This command is not yet implemented.'));
}

export async function listNamesCommand(): Promise<void> {
  console.log(chalk.yellow('Listing all registered names...'));
  console.log(chalk.red('This command is not yet implemented.'));
}

export async function infoCommand(name: string): Promise<void> {
  console.log(chalk.yellow(`Getting info for name: ${name}`));
  console.log(chalk.red('This command is not yet implemented.'));
}
