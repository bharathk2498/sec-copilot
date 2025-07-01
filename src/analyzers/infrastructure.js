const fs = require('fs');
const path = require('path');

class InfrastructureAnalyzer {
  constructor(options) {
    this.options = options;
    this.demoMode = options.demo !== false;
  }

  async analyze() {
    if (this.demoMode) {
      return this.getDemoFindings();
    }

    const findings = [];
    
    try {
      await this.analyzeKubernetes(findings);
      await this.analyzeDockerCompose(findings);
      await this.analyzeSystemConfig(findings);
    } catch (error) {
      console.warn('Infrastructure analysis failed:', error.message);
    }
    
    return findings;
  }

  async analyzeKubernetes(findings) {
    const k8sFiles = ['deployment.yaml', 'service.yaml', 'k8s/deployment.yaml'];
    
    k8sFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.analyzeK8sManifest(file, findings);
      }
    });
  }

  analyzeK8sManifest(file, findings) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('privileged: true')) {
        findings.push({
          id: `K8S_PRIV_${Date.now()}`,
          severity: 'critical',
          category: 'Container Security',
          title: 'Kubernetes privileged container',
          description: 'Container running with privileged access',
          file,
          recommendation: 'Remove privileged mode',
          businessImpact: 'Container escape, host compromise',
          confidence: 'high'
        });
      }

      if (!content.includes('runAsNonRoot: true')) {
        findings.push({
          id: `K8S_ROOT_${Date.now()}`,
          severity: 'high',
          category: 'Container Security',
          title: 'Container running as root',
          description: 'Container may be running as root user',
          file,
          recommendation: 'Set runAsNonRoot: true',
          businessImpact: 'Privilege escalation risk',
          confidence: 'medium'
        });
      }

      if (!content.includes('resources:')) {
        findings.push({
          id: `K8S_LIMITS_${Date.now()}`,
          severity: 'medium',
          category: 'Resource Management',
          title: 'Missing resource limits',
          description: 'Container lacks CPU/memory limits',
          file,
          recommendation: 'Add resource limits and requests',
          businessImpact: 'Resource exhaustion, DoS risk',
          confidence: 'high'
        });
      }
    } catch (error) {
      console.warn(`Failed to analyze ${file}:`, error.message);
    }
  }

  async analyzeDockerCompose(findings) {
    const composeFiles = ['docker-compose.yml', 'docker-compose.yaml'];
    
    composeFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          if (content.includes('privileged: true')) {
            findings.push({
              id: `COMPOSE_PRIV_${Date.now()}`,
              severity: 'high',
              category: 'Container Security',
              title: 'Docker Compose privileged mode',
              description: 'Service running with privileged access',
              file,
              recommendation: 'Remove privileged mode',
              businessImpact: 'Host system access risk',
              confidence: 'high'
            });
          }

          if (!content.includes('restart:')) {
            findings.push({
              id: `COMPOSE_RESTART_${Date.now()}`,
              severity: 'medium',
              category: 'Availability',
              title: 'Missing restart policy',
              description: 'Service lacks restart policy',
              file,
              recommendation: 'Add restart policy',
              businessImpact: 'Service unavailability on failure',
              confidence: 'medium'
            });
          }
        } catch (error) {
          console.warn(`Failed to analyze ${file}:`, error.message);
        }
      }
    });
  }

  async analyzeSystemConfig(findings) {
    const configFiles = ['.env', 'config.json', 'nginx.conf'];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        findings.push({
          id: `CONFIG_${Date.now()}`,
          severity: file === '.env' ? 'high' : 'medium',
          category: 'Configuration Security',
          title: `Configuration file security review needed`,
          description: `${file} may contain sensitive data`,
          file,
          recommendation: 'Review file for sensitive information',
          businessImpact: 'Information disclosure risk',
          confidence: 'medium'
        });
      }
    });
  }

  getDemoFindings() {
    return [
      {
        id: 'INFRA_001',
        severity: 'critical',
        category: 'Container Security',
        title: 'Kubernetes pod running privileged containers',
        description: 'Production pod configured with privileged: true',
        file: 'k8s/deployment.yaml',
        line: 34,
        recommendation: 'Remove privileged mode and use specific capabilities',
        businessImpact: 'Container escape, host system compromise',
        confidence: 'high'
      },
      {
        id: 'INFRA_002',
        severity: 'high',
        category: 'Container Security',
        title: 'Kubernetes container running as root',
        description: 'Container spec does not set runAsNonRoot: true',
        file: 'k8s/deployment.yaml',
        line: 28,
        recommendation: 'Set runAsUser to non-zero and runAsNonRoot: true',
        businessImpact: 'Privilege escalation within container',
        confidence: 'high'
      },
      {
        id: 'INFRA_003',
        severity: 'high',
        category: 'Network Security',
        title: 'Kubernetes service without network policies',
        description: 'No network policies defined to restrict pod communication',
        file: 'k8s/service.yaml',
        recommendation: 'Implement Kubernetes network policies',
        businessImpact: 'Lateral movement in compromised cluster',
        confidence: 'medium'
      },
      {
        id: 'INFRA_004',
        severity: 'medium',
        category: 'Resource Management',
        title: 'Missing resource limits in deployment',
        description: 'Container does not define CPU/memory limits',
        file: 'k8s/deployment.yaml',
        line: 45,
        recommendation: 'Add resource requests and limits',
        businessImpact: 'Denial of service, cluster instability',
        confidence: 'high'
      }
    ];
  }
}

module.exports = InfrastructureAnalyzer;
