class ReportGenerator {
  constructor(options) {
    this.options = options;
  }

  async generate(results) {
    console.log(`📄 Generating ${this.options.output} report with ${results.findings.length} finding(s):`);

    results.findings.forEach((finding, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`🔍 ID: ${finding.id}`);
      console.log(`📜 Description: ${finding.description}`);
      console.log(`🚨 Severity: ${finding.severity}`);
      console.log(`📁 File: ${finding.file}`);
      console.log(`🔢 Line: ${finding.line}`);
    });
  }
}

module.exports = ReportGenerator;
