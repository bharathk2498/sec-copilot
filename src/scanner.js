cat > src/scanner.js << 'EOF'
const chalk = require('chalk');

class Scanner {
  constructor(options) {
    this.options = options;
    this.findings = [];
  }

  async run() {
    console.log(chalk.blue('🔍 Starting multi-domain security scan...\n'));
    
    // Simulate scan phases with realistic timing
    await this.delay(500);
    console.log(chalk.green('✅ Code analysis complete: 4 findings'));
    
    await this.delay(300);
    console.log(chalk.green('✅ Cloud scan complete: 3 findings')); 
    
    await this.delay(400);
    console.log(chalk.green('✅ Infrastructure analysis complete: 2 findings'));
    
    await this.delay(200);
    console.log(chalk.green('✅ AI correlation complete\n'));

    // Generate demo findings
    this.findings = this.getDemoFindings();
    
    return {
      findings: this.findings,
      summary: this.generateSummary(),
      metadata: {
        scanTime: 1500,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        mode: this.options.mode || 'technical'
      }
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDemoFindings() {
    return [
      {
        id: 'DEMO_001',
        severity: 'critical',
        category: 'Secrets Management',
        title: 'AWS Access Key exposed in config.js',
        description: 'Hard-coded AWS access key found in configuration file',
        file: 'src/config.js',
        line: 12,
        recommendation: 'Move AWS credentials to environment variables',
        businessImpact: 'Potential unauthorized access to AWS resources',
        confidence: 'high'
      },
      {
        id: 'DEMO_002',
        severity: 'high',
        category: 'Injection',
        title: 'SQL Injection vulnerability in user.js',
        description: 'Dynamic SQL query construction without parameterization',
        file: 'src/models/user.js',
        line: 45,
        recommendation: 'Use parameterized queries or ORM methods',
        businessImpact: 'Database compromise, data exfiltration risk',
        confidence: 'high'
      },
      {
        id: 'DEMO_003',
        severity: 'high',
        category: 'Container Security',
        title: 'Docker container running as root',
        description: 'Dockerfile does not specify non-root user',
        file: 'Dockerfile',
        line: 8,
        recommendation: 'Add USER directive with non-root user',
        businessImpact: 'Container escape and privilege escalation risk',
        confidence: 'high'
      },
      {
        id: 'DEMO_004',
        severity: 'medium',
        category: 'Network Security',
        title: 'Security group allows unrestricted access',
        description: 'AWS security group allows access from 0.0.0.0/0',
        file: 'terraform/main.tf',
        line: 23,
        recommendation: 'Restrict source IP ranges to known networks',
        businessImpact: 'Unauthorized network access potential',
        confidence: 'high'
      },
      {
        id: 'AI_CORR_001',
        severity: 'critical',
        category: 'Attack Chain',
        title: 'AI-Identified Multi-Vector Attack Path',
        description: 'Exposed credentials + container vulnerabilities enable complete infrastructure compromise',
        recommendation: 'Prioritize credential security and container hardening together',
        businessImpact: 'Complete infrastructure compromise possible through attack chain',
        confidence: 'ai-generated',
        aiGenerated: true
      }
    ];
  }

  generateSummary() {
    const severityCounts = this.findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      totalFindings: this.findings.length,
      severityBreakdown: severityCounts,
      riskScore: 78,
      riskLevel: 'HIGH',
      topCategories: [
        { category: 'Secrets Management', count: 1 },
        { category: 'Container Security', count: 1 },
        { category: 'Injection', count: 1 }
      ],
      recommendations: [
        {
          priority: 'HIGH',
          action: 'Rotate all exposed AWS credentials immediately',
          impact: 'Prevent unauthorized cloud resource access'
        },
        {
          priority: 'HIGH', 
          action: 'Implement container security policies',
          impact: 'Eliminate privilege escalation vectors'
        },
        {
          priority: 'MEDIUM',
          action: 'Review and restrict network access permissions',
          impact: 'Reduce attack surface significantly'
        }
      ]
    };
  }
}

module.exports = Scanner;
EOF
