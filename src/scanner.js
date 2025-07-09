cat > src/scanner.js << 'EOF'
const chalk = require('chalk');

class Scanner {
  constructor(options) {
    this.options = options;
    this.findings = [];
  }

  async run() {
    console.log(chalk.blue('🔍 Starting multi-domain security scan...\n'));
    
    // Simulate scan phases
    console.log(chalk.green('✅ Code analysis complete: 4 findings'));
    console.log(chalk.green('✅ Cloud scan complete: 3 findings')); 
    console.log(chalk.green('✅ Infrastructure analysis complete: 2 findings'));
    console.log(chalk.green('✅ AI correlation complete\n'));

    // Generate demo findings
    this.findings = this.getDemoFindings();
    
    return {
      findings: this
