const fs = require('fs');
const path = require('path');
const glob = require('glob');

class CodeAnalyzer {
  constructor(options) {
    this.options = options;
    this.repoPath = options.repo || '.';
    this.demoMode = options.demo !== false;
  }

  async analyze() {
    if (this.demoMode) {
      return this.getDemoFindings();
    }

    const findings = [];
    
    await this.scanJavaScript(findings);
    await this.scanPython(findings);
    await this.scanDockerfiles(findings);
    await this.scanSecrets(findings);
    
    return findings;
  }

  async scanJavaScript(findings) {
    try {
      const jsFiles = glob.sync(`${this.repoPath}/**/*.{js,ts,jsx,tsx}`, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
      });

      for (const file of jsFiles.slice(0, 50)) {
        const content = fs.readFileSync(file, 'utf8');
        this.checkSQLInjection(content, file, findings);
        this.checkXSS(content, file, findings);
        this.checkHardcodedSecrets(content, file, findings);
      }
    } catch (error) {
      console.warn('JavaScript scan failed:', error.message);
    }
  }

  async scanPython(findings) {
    try {
      const pyFiles = glob.sync(`${this.repoPath}/**/*.py`, {
        ignore: ['**/venv/**', '**/__pycache__/**']
      });

      for (const file of pyFiles.slice(0, 50)) {
        const content = fs.readFileSync(file, 'utf8');
        this.checkEvalUsage(content, file, findings);
        this.checkShellInjection(content, file, findings);
      }
    } catch (error) {
      console.warn('Python scan failed:', error.message);
    }
  }

  async scanDockerfiles(findings) {
    try {
      const dockerFiles = glob.sync(`${this.repoPath}/**/Dockerfile*`);
      
      for (const file of dockerFiles) {
        const content = fs.readFileSync(file, 'utf8');
        this.checkDockerSecurity(content, file, findings);
      }
    } catch (error) {
      console.warn('Docker scan failed:', error.message);
    }
  }

  async scanSecrets(findings) {
    const secretPatterns = [
      { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
      { name: 'GitHub Token', pattern: /ghp_[0-9a-zA-Z]{36}/ },
      { name: 'API Key', pattern: /api[_-]?key['":\s=]*['"][0-9a-zA-Z]{20,}['"]/ }
    ];

    try {
      const allFiles = glob.sync(`${this.repoPath}/**/*`, {
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
        nodir: true
      });

      for (const file of allFiles.slice(0, 100)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          secretPatterns.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
              findings.push({
                id: `SECRET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                severity: 'critical',
                category: 'Secrets Management',
                title: `Potential ${name} exposed`,
                description: `Possible ${name} found in source code`,
                file: path.relative(this.repoPath, file),
                line: this.getLineNumber(content, pattern),
                recommendation: `Remove ${name} from source code and use environment variables`,
                businessImpact: 'Credential exposure could lead to unauthorized access',
                confidence: 'medium'
              });
            }
          });
        } catch (error) {
          // Skip binary files
        }
      }
    } catch (error) {
      console.warn('Secret scan failed:', error.message);
    }
  }

  checkSQLInjection(content, file, findings) {
    const patterns = [
      /query\s*=\s*['"]\s*SELECT.*\+/i,
      /execute\s*\(\s*['"].*\+/i
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        findings.push({
          id: `SQL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          severity: 'high',
          category: 'Injection',
          title: 'Potential SQL Injection',
          description: 'SQL query construction using string concatenation detected',
          file: path.relative(this.repoPath, file),
          line: this.getLineNumber(content, pattern),
          recommendation: 'Use parameterized queries or prepared statements',
          businessImpact: 'Data breach, unauthorized data access',
          confidence: 'high'
        });
      }
    });
  }

  checkXSS(content, file, findings) {
    const patterns = [
      /innerHTML\s*=\s*.*\+/,
      /document\.write\s*\(/
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        findings.push({
          id: `XSS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          severity: 'medium',
          category: 'Cross-Site Scripting',
          title: 'Potential XSS Vulnerability',
          description: 'Dynamic HTML content generation without proper sanitization',
          file: path.relative(this.repoPath, file),
          line: this.getLineNumber(content, pattern),
          recommendation: 'Use proper output encoding and input validation',
          businessImpact: 'Session hijacking, malicious script execution',
          confidence: 'medium'
        });
      }
    });
  }

  checkDockerSecurity(content, file, findings) {
    if (content.includes('FROM') && content.includes(':latest')) {
      findings.push({
        id: `DOCKER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'medium',
        category: 'Container Security',
        title: 'Docker image using latest tag',
        description: 'Using latest tag makes builds non-deterministic',
        file: path.relative(this.repoPath, file),
        recommendation: 'Use specific version tags for base images',
        businessImpact: 'Inconsistent deployments, potential security vulnerabilities',
        confidence: 'high'
      });
    }

    if (!content.includes('USER ') || content.includes('USER root')) {
      findings.push({
        id: `DOCKER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'high',
        category: 'Container Security',
        title: 'Docker container running as root',
        description: 'Container may be running with elevated privileges',
        file: path.relative(this.repoPath, file),
        recommendation: 'Create and use a non-root user in Docker container',
        businessImpact: 'Privilege escalation risk, container escape potential',
        confidence: 'high'
      });
    }
  }

  getLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 1;
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
        severity: 'medium',
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
        category: 'Cross-Site Scripting',
        title: 'Potential XSS in template.js',
        description: 'User input rendered without proper encoding',
        file: 'src/views/template.js',
        line: 23,
        recommendation: 'Use template engine with auto-escaping',
        businessImpact: 'Session hijacking, malicious script execution',
        confidence: 'medium'
      }
    ];
  }
}

module.exports = CodeAnalyzer;
