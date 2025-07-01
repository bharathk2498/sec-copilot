#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const Scanner = require('../src/scanner');
const ReportGenerator = require('../src/reports');
const ConfigManager = require('../src/config');

const program = new Command();

program
  .name('sec-copilot')
  .description('AI-powered security co-pilot for multi-domain security analysis')
  .version('1.0.0');

program
  .command('scan')
  .description('Perform security scan across multiple domains')
  .option('-r, --repo <path>', 'Repository path to scan', '.')
  .option('-c, --cloud <provider>', 'Cloud provider (aws|azure|gcp)', 'aws')
  .option('-m, --mode <type>', 'Report mode (technical|executive|compliance)', 'technical')
  .option('-o, --output <format>', 'Output format (json|markdown|table)', 'table')
  .option('-s, --severity <level>', 'Minimum severity (low|medium|high|critical)', 'medium')
  .option('--demo', 'Run in demo mode (no API calls)', false)
  .action(async (options) => {
    console.log(chalk.blue.bold('🛡️  SecCopilot - AI Security Analysis\n'));
    
    try {
      const scanner = new Scanner(options);
      const results = await scanner.run();
      
      const reporter = new ReportGenerator(options);
      await reporter.generate(results);
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Configure SecCopilot settings')
  .option('--set <key=value>', 'Set configuration value')
  .option('--get <key>', 'Get configuration value')
  .option('--list', 'List all configuration')
  .action(async (options) => {
    const config = new ConfigManager();
    await config.handle(options);
  });

program
  .command('ci-gate')
  .description('CI/CD security gate')
  .option('--fail-on <severity>', 'Fail on severity level', 'critical')
  .option('--report <webhook>', 'Report webhook URL')
  .option('--format <type>', 'Report format', 'json')
  .action(async (options) => {
    console.log(chalk.yellow.bold('🚦 CI/CD Security Gate\n'));
    
    const scanner = new Scanner({ ...options, mode: 'ci' });
    const results = await scanner.run();
    
    const hasCritical = results.findings.some(f => f.severity === options.failOn);
    
    if (hasCritical) {
      console.log(chalk.red.bold('❌ Security gate FAILED - Critical issues found'));
      process.exit(1);
    } else {
      console.log(chalk.green.bold('✅ Security gate PASSED'));
      process.exit(0);
    }
  });

program
  .command('threat-intel')
  .description('Query threat intelligence')
  .option('-q, --query <terms>', 'Search terms')
  .option('-t, --type <type>', 'Intelligence type (cve|ioc|apt)', 'cve')
  .action(async (options) => {
    console.log(chalk.cyan.bold('🔍 Threat Intelligence Query\n'));
    console.log(chalk.green('Feature coming in next release!'));
  });

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled rejection:'), reason);
  process.exit(1);
});

program.parse();
