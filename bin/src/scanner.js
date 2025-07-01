const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const glob = require('glob');
const CodeAnalyzer = require('./analyzers/code');
const CloudAnalyzer = require('./analyzers/cloud');
const InfraAnalyzer = require('./analyzers/infrastructure');
const AIEngine = require('./ai-engine');

class Scanner {
  constructor(options) {
    this.options = options;
    this.findings = [];
    this.spinner = ora();
    this.ai = new AIEngine(options);
  }

  async run() {
    console.log(chalk.blue('🔍 Starting multi-domain security scan...\n'));
    
    const startTime = Date.now();
    
    await this.scanCode();
    await this.scanCloud();
    await this.scanInfrastructure();
    await this.correlateFindings();
    
    const duration = Date.now() - startTime;
    
    return {
      findings: this.findings,
      summary: this.generateSummary(),
      metadata: {
        scanTime: duration,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        mode: this.options.mode || 'technical'
      }
    };
  }

  async scanCode() {
    this.spinner.start('Analyzing code security...');
    
    try {
      const codeAnalyzer = new CodeAnalyzer(this.options);
      const codeFindings = await codeAnalyzer.analyze();
      this.findings.push(...codeFindings);
      
      this.spinner.succeed(`Code analysis complete: ${codeFindings.length} findings`);
    } catch (error) {
      this.spinner.fail('Code analysis failed');
      throw error;
    }
  }

  async scanCloud() {
    this.spinner.start('Scanning cloud configuration...');
    
    try {
      const cloudAnalyzer = new CloudAnalyzer(this.options);
      const cloudFindings = await cloudAnalyzer.analyze();
      this.findings.push(...cloudFindings);
      
      this.spinner.succeed(`Cloud scan complete: ${cloudFindings.length} findings`);
    } catch (error) {
      this.spinner.fail('Cloud scan failed');
      throw error;
    }
  }

  async scanInfrastructure() {
    this.spinner.start('Analyzing infrastructure...');
    
    try {
      const infraAnalyzer = new InfraAnalyzer(this.options);
      const infraFindings = await infraAnalyzer.analyze();
      this.findings.push(...infraFindings);
      
      this.spinner.succeed(`Infrastructure analysis complete: ${infraFindings.length} findings`);
    } catch (error) {
      this.spinner.fail('Infrastructure analysis failed');
      throw error;
    }
  }

  async correlateFindings() {
    if (this.findings.length === 0) return;
    
    this.spinner.start('AI correlation analysis...');
    
    try {
      const correlatedFindings = await this.ai.correlateFindings(this.findings);
      this.findings = correlatedFindings;
      
      this.spinner.succeed('AI correlation complete');
    } catch (error) {
      this.spinner.warn('AI correlation failed, using original findings');
    }
  }

  generateSummary() {
    const severityCounts = this.findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {});

    const riskScore = this.calculateRiskScore();
    
    return {
      totalFindings: this.findings.length,
      severityBreakdown: severityCounts,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      topCategories: this.getTopCategories(),
      recommendations: this.getTopRecommendations()
    };
  }

  calculateRiskScore() {
    if (this.findings.length === 0) return 0;
    
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    const totalScore = this.findings.reduce((score, finding) => {
      return score + (weights[finding.severity] || 0);
    }, 0);
    
    return Math.min(100, Math.round(totalScore / this.findings.length * 10));
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  getTopCategories() {
    const categories = this.findings.reduce((acc, finding) => {
      acc[finding.category] = (acc[finding.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  getTopRecommendations() {
    const criticalFindings = this.findings
      .filter(f => f.severity === 'critical')
      .slice(0, 3);

    return criticalFindings.map(f => ({
      priority: 'HIGH',
      action: f.recommendation,
      impact: f.businessImpact || 'Security risk mitigation'
    }));
  }
}

module.exports = Scanner;
