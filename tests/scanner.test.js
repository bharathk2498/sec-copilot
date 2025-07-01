const Scanner = require('../src/scanner');

describe('Scanner', () => {
  test('should run demo scan successfully', async () => {
    const scanner = new Scanner({ demo: true });
    const results = await scanner.run();
    
    expect(results).toHaveProperty('findings');
    expect(results).toHaveProperty('summary');
    expect(results.findings.length).toBeGreaterThan(0);
  });

  test('should calculate risk score correctly', () => {
    const scanner = new Scanner({ demo: true });
    
    expect(scanner.getRiskLevel(90)).toBe('CRITICAL');
    expect(scanner.getRiskLevel(70)).toBe('HIGH');
    expect(scanner.getRiskLevel(50)).toBe('MEDIUM');
    expect(scanner.getRiskLevel(30)).toBe('LOW');
  });

  test('should generate proper summary', async () => {
    const scanner = new Scanner({ demo: true });
    const results = await scanner.run();
    const { summary } = results;
    
    expect(summary).toHaveProperty('totalFindings');
    expect(summary).toHaveProperty('severityBreakdown');
    expect(summary).toHaveProperty('riskScore');
    expect(summary.riskScore).toBeGreaterThanOrEqual(0);
    expect(summary.riskScore).toBeLessThanOrEqual(100);
  });
});
