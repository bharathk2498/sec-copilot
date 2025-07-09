#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const Scanner = require('../src/scanner');
const ReportGenerator = require('../src/reports');

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
    console.log(chalk.blue.bold('\n🛡️  SecCopilot - AI Security Analysis\n'));
    console.log("⚙️ scan command triggered with options:", options);

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

program.parse(process.argv);
