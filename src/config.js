const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const inquirer = require('inquirer');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.sec-copilot');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      ai: {
        provider: 'claude',
        apiKey: null,
        model: 'claude-3-sonnet-20240229',
        demoMode: true
      },
      scanning: {
        defaultSeverity: 'medium',
        includeTests: false,
        maxFileSize: 1048576,
        excludePatterns: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**'
        ]
      },
      reporting: {
        defaultFormat: 'table',
        saveReports: true,
        reportDir: './security-reports'
      }
    };
  }

  async handle(options) {
    if (options.set) {
      await this.setValue(options.set);
    } else if (options.get) {
      await this.getValue(options.get);
    } else if (options.list) {
      await this.listConfig();
    } else {
      await this.interactiveConfig();
    }
  }

  async interactiveConfig() {
    console.log(chalk.blue.bold('🔧 SecCopilot Configuration\n'));
    
    const choices = [
      { name: 'Setup AI Integration (Claude API)', value: 'ai' },
      { name: 'Configure Scanning Options', value: 'scanning' },
      { name: 'Setup Reporting Preferences', value: 'reporting' },
      { name: 'View Current Configuration', value: 'view' }
    ];

    try {
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to configure?',
        choices
      }]);

      switch (action) {
        case 'ai':
          await this.configureAI();
          break;
        case 'scanning':
          await this.configureScanning();
          break;
        case 'reporting':
          await this.configureReporting();
          break;
        case 'view':
          await this.listConfig();
          break;
      }
    } catch (error) {
      console.log(chalk.yellow('\nConfiguration cancelled or failed.'));
    }
  }

  async configureAI() {
    console.log(chalk.yellow('\n🤖 AI Configuration'));
    
    const config = this.loadConfig();
    
    try {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableAI',
          message: 'Enable AI-powered analysis?',
          default: !config.ai.demoMode
        },
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your Claude API key (leave empty for demo mode):',
          default: config.ai.apiKey || '',
          when: (answers) => answers.enableAI
        }
      ]);

      if (answers.enableAI) {
        config.ai.demoMode = !answers.apiKey;
        config.ai.apiKey = answers.apiKey || null;
      } else {
        config.ai.demoMode = true;
        config.ai.apiKey = null;
      }

      this.saveConfig(config);
      console.log(chalk.green('✅ AI configuration saved!'));
    } catch (error) {
      console.log(chalk.yellow('Configuration cancelled.'));
    }
  }

  async configureScanning() {
    console.log(chalk.yellow('\n🔍 Scanning Configuration'));
    
    const config = this.loadConfig();
    
    try {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'defaultSeverity',
          message: 'Default minimum severity:',
          choices: ['low', 'medium', 'high', 'critical'],
          default: config.scanning.defaultSeverity
        },
        {
          type: 'confirm',
          name: 'includeTests',
          message: 'Include test files in scans?',
          default: config.scanning.includeTests
        }
      ]);

      config.scanning = { ...config.scanning, ...answers };
      this.saveConfig(config);
      console.log(chalk.green('✅ Scanning configuration saved!'));
    } catch (error) {
      console.log(chalk.yellow('Configuration cancelled.'));
    }
  }

  async configureReporting() {
    console.log(chalk.yellow('\n📊 Reporting Configuration'));
    
    const config = this.loadConfig();
    
    try {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'defaultFormat',
          message: 'Default report format:',
          choices: ['table', 'json', 'markdown'],
          default: config.reporting.defaultFormat
        },
        {
          type: 'confirm',
          name: 'saveReports',
          message: 'Automatically save reports?',
          default: config.reporting.saveReports
        }
      ]);

      config.reporting = { ...config.reporting, ...answers };
      this.saveConfig(config);
      console.log(chalk.green('✅ Reporting configuration saved!'));
    } catch (error) {
      console.log(chalk.yellow('Configuration cancelled.'));
    }
  }

  async setValue(keyValue) {
    const [key, value] = keyValue.split('=');
    if (!key || value === undefined) {
      console.error(chalk.red('Invalid format. Use: key=value'));
      return;
    }

    const config = this.loadConfig();
    this.setNestedValue(config, key, value);
    this.saveConfig(config);
    
    console.log(chalk.green(`✅ Set ${key} = ${value}`));
  }

  async getValue(key) {
    const config = this.loadConfig();
    const value = this.getNestedValue(config, key);
    
    if (value !== undefined) {
      console.log(`${key} = ${JSON.stringify(value)}`);
    } else {
      console.log(chalk.yellow(`Key '${key}' not found`));
    }
  }

  async listConfig() {
    const config = this.loadConfig();
    
    console.log(chalk.blue.bold('\n📋 Current Configuration:\n'));
    console.log(JSON.stringify(config, null, 2));
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const configData = fs.readFileSync(this.configFile, 'utf8');
        return { ...this.defaultConfig, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.warn(chalk.yellow('Warning: Failed to load config, using defaults'));
    }
    
    return { ...this.defaultConfig };
  }

  saveConfig(config) {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red('Failed to save configuration:'), error.message);
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    
    try {
      target[lastKey] = JSON.parse(value);
    } catch {
      target[lastKey] = value;
    }
  }
}

module.exports = ConfigManager;
