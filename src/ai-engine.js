const axios = require('axios');

class AIEngine {
  constructor(options) {
    this.options = options;
    this.demoMode = options.demo !== false;
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
  }

  async correlateFindings(findings) {
    if (this.demoMode || !this.claudeApiKey) {
      return this.getDemoCorrelation(findings);
    }

    try {
      const correlatedFindings = await this.callClaudeAPI(findings);
      return correlatedFindings;
    } catch (error) {
      console.warn('AI correlation failed, using original findings');
      return findings;
    }
  }

  async callClaudeAPI(findings) {
    const prompt = this.buildCorrelationPrompt(findings);
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${this.claudeApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey
      }
    });

    return this.parseClaudeResponse(response.data.content[0].text, findings);
  }

  buildCorrelationPrompt(findings) {
    const findingsText = findings.map(f => 
      `- ${f.severity.toUpperCase()}: ${f.title} (${f.category})`
    ).join('\n');

    return `As a cybersecurity expert, analyze these security findings and provide correlations and prioritized recommendations:

Security Findings:
${findingsText}

Respond with JSON:
{
  "correlations": [
    {
      "findingIds": ["id1", "id2"],
      "attackScenario": "description",
      "combinedRisk": "critical|high|medium|low"
    }
  ],
  "prioritizedRecommendations": [
    {
      "priority": 1,
      "action": "specific action",
      "impact": "business impact",
      "effort": "low|medium|high"
    }
  ]
}`;
  }

  parseClaudeResponse(responseText, originalFindings) {
    try {
      const aiAnalysis = JSON.parse(responseText);
      
      const enhancedFindings = originalFindings.map(finding => ({
        ...finding,
        aiInsights: {
          priorityScore: this.calculatePriorityScore(finding),
          businessContext: this.getBusinessContext(finding)
        }
      }));

      if (aiAnalysis.correlations) {
        aiAnalysis.correlations.forEach(correlation => {
          enhancedFindings.push({
            id: `AI_CORR_${Date.now()}`,
            severity: correlation.combinedRisk,
            category: 'Attack Chain',
            title: 'AI-Identified Attack Chain',
            description: correlation.attackScenario,
            recommendation: 'Address all related findings together',
            businessImpact: 'Combined attack chain increases risk',
            confidence: 'ai-generated',
            aiGenerated: true
          });
        });
      }

      return enhancedFindings;
    } catch (error) {
      return originalFindings;
    }
  }

  calculatePriorityScore(finding) {
    const severityScores = { critical: 10, high: 7, medium: 4, low: 1 };
    const categoryMultipliers = {
      'Secrets Management': 1.3,
      'Injection': 1.2,
      'Access Control': 1.2,
      'Data Exposure': 1.3
    };

    const baseScore = severityScores[finding.severity] || 1;
    const multiplier = categoryMultipliers[finding.category] || 1.0;
    
    return Math.round(baseScore * multiplier);
  }

  getBusinessContext(finding) {
    const contexts = {
      'critical': 'Immediate business risk requiring executive attention',
      'high': 'Significant security risk affecting operations',
      'medium': 'Moderate risk requiring scheduled remediation',
      'low': 'Minor security improvement opportunity'
    };

    return contexts[finding.severity] || 'Security finding requiring evaluation';
  }

  getDemoCorrelation(findings) {
    const enhancedFindings = findings.map(finding => ({
      ...finding,
      aiInsights: {
        priorityScore: this.calculatePriorityScore(finding),
        businessContext: this.getBusinessContext(finding)
      }
    }));

    if (findings.length >= 2) {
      enhancedFindings.push({
        id: 'AI_CORR_001',
        severity: 'critical',
        category: 'Attack Chain',
        title: 'AI-Identified Multi-Vector Attack Path',
        description: 'Exposed credentials + container vulnerabilities enable complete infrastructure compromise',
        recommendation: 'Prioritize credential security and container hardening together',
        businessImpact: 'Complete infrastructure compromise possible',
        confidence: 'ai-generated',
        aiGenerated: true,
        aiInsights: {
          priorityScore: 10,
          businessContext: 'Critical business systems at risk'
        }
      });
    }

    return enhancedFindings;
  }
}

module.exports = AIEngine;
