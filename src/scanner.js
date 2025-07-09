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
          description: 'Hardcoded secret found',
          severity: 'high',
          file: 'src/app.js',
          line: 27
        }
      ]
    };
  }
}

module.exports = Scanner;
