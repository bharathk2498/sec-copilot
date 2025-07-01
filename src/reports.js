const fs = require('fs');
const chalk = require('chalk');
const { table } = require('table');

class ReportGenerator {
  constructor(options) {
    this.options = options;
    this.mode = options.mode || 'technical';
    this.format = options.output || 'table';
  }

  async generate(results) {
    switch (this.format) {
      case 'json':
        return this.generateJSON(results);
      case 'markdown':
        return this.generateMarkdown(results);
      case 'table':
      default:
        return this.generateTable(results);
    }
  }

  generateTable(results) {
    console.log(chalk.blue.bold('\n📊 SECURITY SCAN RESULTS\n'));
    
    this.printSummary(results.summary);
    
    if (results.findings.length > 0) {
      this.printFindingsTable(results.findings);
    } else {
      console.log(chalk.green('✅ No security issues found!'));
    }

    if (this.mode === 'executive') {
      this.printExecutiveSummary(results);
    }

    this.printRecommendations(results.summary.recommendations);
  }

  printSummary(summary) {
    const riskColor = this.getRiskColor(summary.riskLevel);
    
    console.log(chalk.bold('🎯 SUMMARY'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Total Findings: ${chalk.yellow(summary.totalFindings)}`);
    console.log(`Risk Level: ${riskColor(summary.riskLevel)} (Score: ${summary.riskScore}/100)`);
    
    if (summary.severityBreakdown) {
      const breakdown = Object.entries(summary.severityBreakdown)
        .map(([severity, count]) => `${this.getSeverityIcon(severity)} ${severity}: ${count}`)
        .join('  ');
      console.log(`Severity: ${breakdown}`);
    }
    
    console.log();
  }

  printFindingsTable(findings) {
    console.log(chalk.bold('🔍 DETAILED FINDINGS'));
    console.log(chalk.gray('─'.repeat(50)));

    const minSeverity = this.options.severity || 'low';
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const minIndex = severityOrder.indexOf(minSeverity);
    
    const filteredFindings = findings.filter(f => 
      severityOrder.indexOf(f.severity) <= minIndex
    );

    if (filteredFindings.length === 0) {
      console.log(chalk.green(`No findings at ${minSeverity} severity or above.`));
      return;
    }

    const sortedFindings = filteredFindings.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    });

    const tableData = [
      ['ID', 'Severity', 'Category', 'Title', 'File']
    ];

    sortedFindings.forEach(finding => {
      tableData.push([
        finding.id.substring(0, 12) + '...',
        this.colorSeverity(finding.severity),
        finding.category,
        this.truncateText(finding.title, 40),
        finding.file || 'N/A'
      ]);
    });

    console.log(table(tableData));

    const criticalFindings = sortedFindings.filter(f => f.severity === 'critical');
    if (criticalFindings.length > 0) {
      console.log(chalk.red.bold('\n🚨 CRITICAL FINDINGS - IMMEDIATE ACTION REQUIRED'));
      console.log(chalk.gray('─'.repeat(60)));
      
      criticalFindings.forEach((finding, index) => {
        console.log(chalk.red.bold(`${index + 1}. ${finding.title}`));
        console.log(`   ${chalk.gray('Description:')} ${finding.description}`);
        console.log(`   ${chalk.gray('File:')} ${finding.file}${finding.line ? `:${finding.line}` : ''}`);
        console.log(`   ${chalk.gray('Impact:')} ${finding.businessImpact || 'Security risk'}`);
        console.log(`   ${chalk.gray('Action:')} ${finding.recommendation}`);
        console.log();
      });
    }
  }

  printExecutiveSummary(results) {
    console.log(chalk.blue.bold('\n👔 EXECUTIVE SUMMARY'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const { summary } = results;
    const criticalCount = summary.severityBreakdown?.critical || 0;
    const highCount = summary.severityBreakdown?.high || 0;
    
    console.log(chalk.bold('Business Risk Assessment:'));
    if (criticalCount > 0) {
      console.log(chalk.red(`• ${criticalCount} critical security gaps requiring immediate attention`));
      console.log(chalk.red('• High risk of data breach and regulatory non-compliance'));
    }
    
    if (highCount > 0) {
      console.log(chalk.yellow(`• ${highCount} high-priority security improvements needed`));
    }
    
    console.log(chalk.bold('\nRecommended Timeline:'));
    console.log('• Critical issues: 24-48 hours');
    console.log('• High priority: 1-2 weeks'); 
    console.log('• Medium priority: 1 month');
    
    console.log();
  }

  printRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) return;
    
    console.log(chalk.blue.bold('💡 TOP RECOMMENDATIONS'));
    console.log(chalk.gray('─'.repeat(50)));
    
    recommendations.forEach((rec, index) => {
      console.log(`${chalk.bold(index + 1 + '.')} ${rec.action}`);
      console.log(`   ${chalk.gray('Priority:')} ${rec.priority}`);
      console.log(`   ${chalk.gray('Impact:')} ${rec.impact}`);
      console.log();
    });
  }

  generateJSON(results) {
    const output = {
      ...results,
      generatedAt: new Date().toISOString(),
      format: 'json',
      mode: this.mode
    };
    
    const filename = `security-report-${Date.now()}.json`;
    
    try {
      fs.writeFileSync(filename, JSON.stringify(output, null, 2));
      console.log(chalk.green(`📄 Report saved to: ${filename}`));
    } catch (error) {
      console.warn('Failed to save report file');
    }
    
    console.log(JSON.stringify(output, null, 2));
  }

  generateMarkdown(results) {
    const md = this.buildMarkdownReport(results);
    const filename = `security-report-${Date.now()}.md`;
    
    try {
      fs.writeFileSync(filename, md);
      console.log(chalk.green(`📄 Report saved to: ${filename}`));
    } catch (error) {
      console.warn('Failed to save report file');
    }
    
    console.log(md);
  }

  buildMarkdownReport(results) {
    const { summary, findings, metadata } = results;
    
    let md = `# Security Scan Report\n\n`;
    md += `**Generated:** ${metadata.timestamp}\n`;
    md += `**Scan Duration:** ${metadata.scanTime}ms\n\n`;
    
    md += `## Executive Summary\n\n`;
    md += `- **Total Findings:** ${summary.totalFindings}\n`;
    md += `- **Risk Level:** ${summary.riskLevel} (${summary.riskScore}/100)\n`;
    md += `- **Critical Issues:** ${summary.severityBreakdown?.critical || 0}\n\n`;
    
    md += `## Critical Findings\n\n`;
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    
    if (criticalFindings.length > 0) {
      criticalFindings.forEach((finding, index) => {
        md += `### ${index + 1}. ${finding.title}\n\n`;
        md += `- **Severity:** Critical\n`;
        md += `- **Category:** ${finding.category}\n`;
        md += `- **File:** ${finding.file}\n`;
        md += `- **Description:** ${finding.description}\n`;
        md += `- **Recommendation:** ${finding.recommendation}\n\n`;
      });
    } else {
      md += `No critical findings identified.\n\n`;
    }
    
    return md;
  }

  getRiskColor(level) {
    const colors = {
      'CRITICAL': chalk.red.bold,
      'HIGH': chalk.red,
      'MEDIUM': chalk.yellow,
      'LOW': chalk.green
    };
    return colors[level] || chalk.gray;
  }

  getSeverityIcon(severity) {
    const icons = {
      'critical': '🔴',
      'high': '🟡', 
      'medium': '🟠',
      'low': '🟢'
    };
    return icons[severity] || '⚪';
  }

  colorSeverity(severity) {
    const colors = {
      'critical': chalk.red.bold(severity.toUpperCase()),
      'high': chalk.red(severity.toUpperCase()),
      'medium': chalk.yellow(severity.toUpperCase()),
      'low': chalk.green(severity.toUpperCase())
    };
    return colors[severity] || severity;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

module.exports = ReportGenerator;
