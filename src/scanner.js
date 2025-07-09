class Scanner {
  constructor(options) {
    this.options = options;
  }

  async run() {
    console.log(`🔍 Scanning repo at ${this.options.repo} in ${this.options.mode} mode...`);
    if (this.options.demo) {
      console.log('🧪 Running in demo mode — no external API calls will be made.');
    }

    return {
      findings: [
        {
          id: 'SEC-001',
          description: 'Example hardcoded secret found',
          severity: 'high',
          file: 'src/example.js',
          line: 42
        }
      ]
    };
  }
}

module.exports = Scanner;
