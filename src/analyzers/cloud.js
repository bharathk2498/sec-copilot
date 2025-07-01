const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

class CloudAnalyzer {
  constructor(options) {
    this.options = options;
    this.provider = options.cloud || 'aws';
    this.demoMode = options.demo !== false;
  }

  async analyze() {
    if (this.demoMode) {
      return this.getDemoFindings();
    }

    const findings = [];
    
    try {
      await this.scanCloudFormation(findings);
      await this.scanTerraform(findings);
    } catch (error) {
      console.warn('Cloud analysis failed:', error.message);
    }
    
    return findings;
  }

  async scanCloudFormation(findings) {
    const cfFiles = ['template.yaml', 'template.yml', 'cloudformation.yaml'];

    for (const file of cfFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          this.analyzeCloudFormationTemplate(content, file, findings);
        } catch (error) {
          console.warn(`Failed to analyze ${file}:`, error.message);
        }
      }
    }
  }

  analyzeCloudFormationTemplate(content, file, findings) {
    try {
      const template = yaml.parse(content);
      
      if (template.Resources) {
        Object.entries(template.Resources).forEach(([name, resource]) => {
          this.checkS3BucketSecurity(name, resource, file, findings);
          this.checkIAMPolicies(name, resource, file, findings);
          this.checkSecurityGroups(name, resource, file, findings);
        });
      }
    } catch (error) {
      findings.push({
        id: `CF_PARSE_${Date.now()}`,
        severity: 'medium',
        category: 'Configuration',
        title: 'CloudFormation template parsing error',
        description: `Failed to parse CloudFormation template: ${error.message}`,
        file,
        recommendation: 'Fix template syntax errors',
        confidence: 'high'
      });
    }
  }

  checkS3BucketSecurity(name, resource, file, findings) {
    if (resource.Type === 'AWS::S3::Bucket') {
      const props = resource.Properties || {};
      
      if (props.AccessControl === 'PublicRead' || props.AccessControl === 'PublicReadWrite') {
        findings.push({
          id: `S3_PUBLIC_${Date.now()}`,
          severity: 'critical',
          category: 'Data Exposure',
          title: `S3 bucket ${name} allows public access`,
          description: 'S3 bucket configured with public read/write access',
          file,
          recommendation: 'Remove public access and use IAM policies',
          businessImpact: 'Data breach, unauthorized data access',
          confidence: 'high'
        });
      }

      if (!props.BucketEncryption) {
        findings.push({
          id: `S3_ENCRYPTION_${Date.now()}`,
          severity: 'high',
          category: 'Encryption',
          title: `S3 bucket ${name} lacks encryption`,
          description: 'S3 bucket does not have server-side encryption enabled',
          file,
          recommendation: 'Enable S3 server-side encryption',
          businessImpact: 'Data exposure if storage is compromised',
          confidence: 'high'
        });
      }
    }
  }

  checkIAMPolicies(name, resource, file, findings) {
    if (resource.Type === 'AWS::IAM::Policy' || resource.Type === 'AWS::IAM::Role') {
      const policyDoc = resource.Properties?.PolicyDocument;
      
      if (policyDoc && policyDoc.Statement) {
        policyDoc.Statement.forEach((statement) => {
          if (statement.Effect === 'Allow' && statement.Action === '*') {
            findings.push({
              id: `IAM_WILDCARD_${Date.now()}`,
              severity: 'high',
              category: 'Access Control',
              title: `IAM policy ${name} uses wildcard permissions`,
              description: 'IAM policy grants overly broad permissions',
              file,
              recommendation: 'Use principle of least privilege',
              businessImpact: 'Privilege escalation risk',
              confidence: 'high'
            });
          }

          if (statement.Principal === '*') {
            findings.push({
              id: `IAM_PUBLIC_${Date.now()}`,
              severity: 'critical',
              category: 'Access Control',
              title: `IAM policy ${name} allows public access`,
              description: 'IAM policy allows access from any AWS account',
              file,
              recommendation: 'Restrict principal to specific accounts',
              businessImpact: 'Unauthorized access to AWS resources',
              confidence: 'high'
            });
          }
        });
      }
    }
  }

  checkSecurityGroups(name, resource, file, findings) {
    if (resource.Type === 'AWS::EC2::SecurityGroup') {
      const props = resource.Properties || {};
      
      if (props.SecurityGroupIngress) {
        props.SecurityGroupIngress.forEach((rule) => {
          if (rule.CidrIp === '0.0.0.0/0') {
            const severity = (rule.FromPort === 22 || rule.FromPort === 3389) ? 'critical' : 'high';
            
            findings.push({
              id: `SG_OPEN_${Date.now()}`,
              severity,
              category: 'Network Security',
              title: `Security group ${name} allows unrestricted access`,
              description: `Allows access from 0.0.0.0/0 on port ${rule.FromPort}`,
              file,
              recommendation: 'Restrict source IP ranges',
              businessImpact: 'Unauthorized network access',
              confidence: 'high'
            });
          }
        });
      }
    }
  }

  async scanTerraform(findings) {
    const tfFiles = ['main.tf', 'variables.tf', 'outputs.tf'];
    
    tfFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          this.analyzeTerraformFile(content, file, findings);
        } catch (error) {
          console.warn(`Failed to analyze ${file}:`, error.message);
        }
      }
    });
  }

  analyzeTerraformFile(content, file, findings) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('password') && line.includes('=') && !line.includes('var.')) {
        findings.push({
          id: `TF_SECRET_${Date.now()}`,
          severity: 'high',
          category: 'Secrets Management',
          title: 'Hardcoded password in Terraform',
          description: 'Password appears to be hardcoded',
          file,
          line: index + 1,
          recommendation: 'Use Terraform variables or external secrets',
          businessImpact: 'Credential exposure in infrastructure code',
          confidence: 'medium'
        });
      }

      if (line.includes('0.0.0.0/0')) {
        findings.push({
          id: `TF_PUBLIC_${Date.now()}`,
          severity: 'high',
          category: 'Network Security',
          title: 'Terraform resource allows public access',
          description: 'Resource allows access from any IP address',
          file,
          line: index + 1,
          recommendation: 'Restrict access to specific IP ranges',
          businessImpact: 'Unauthorized network access',
          confidence: 'high'
        });
      }
    });
  }

  getDemoFindings() {
    return [
      {
        id: 'CLOUD_001',
        severity: 'critical',
        category: 'Data Exposure',
        title: 'S3 bucket configured for public read access',
        description: 'Production S3 bucket allows public read access',
        file: 'cloudformation/storage.yaml',
        line: 23,
        recommendation: 'Remove public access and implement IAM controls',
        businessImpact: 'Complete data exposure, compliance violations',
        confidence: 'high'
      },
      {
        id: 'CLOUD_002',
        severity: 'critical',
        category: 'Network Security',
        title: 'Security group allows SSH from anywhere',
        description: 'EC2 security group allows SSH access from 0.0.0.0/0',
        file: 'terraform/main.tf',
        line: 45,
        recommendation: 'Restrict SSH access to specific IP ranges',
        businessImpact: 'Unauthorized server access, system compromise',
        confidence: 'high'
      },
      {
        id: 'CLOUD_003',
        severity: 'high',
        category: 'Access Control',
        title: 'IAM role with wildcard permissions',
        description: 'Production IAM role grants Action: "*" permissions',
        file: 'cloudformation/iam.yaml',
        line: 67,
        recommendation: 'Apply principle of least privilege',
        businessImpact: 'Privilege escalation, unauthorized access',
        confidence: 'high'
      },
      {
        id: 'CLOUD_004',
        severity: 'high',
        category: 'Encryption',
        title: 'RDS instance without encryption',
        description: 'Database does not have encryption at rest enabled',
        file: 'terraform/database.tf',
        line: 12,
        recommendation: 'Enable RDS encryption with KMS',
        businessImpact: 'Data exposure if storage is compromised',
        confidence: 'high'
      }
    ];
  }
}

module.exports = CloudAnalyzer;
