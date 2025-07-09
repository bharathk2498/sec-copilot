class ReportGenerator {
  constructor(options) {
    this.options = options;
  }

  async generate(results) {
    console.log(`\n📄 Generating ${this.options.output} report with ${results.findings.length} finding(s):\n`);

    results.findings.forEach((finding, index) => {
      console.log(`[#${index + 1}] ${finding.description}`);
      console.log(`🔒 Severity: ${finding.severity}`);
      console.log(`📁 File: ${finding.file}`);
      console.log(`🔢 Line: ${finding.line}\n`);
    });
  }
}

module.exports = ReportGenerator;
