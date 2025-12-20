/**
 * Quality Agent
 * Reviews AI outputs and triggers re-analysis when confidence is low
 */

import { Agent, AnalysisResult } from './types';
import { PropertyAnalysis } from '@/types/property';

interface QualityCheck {
  passed: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  recommendation: 'accept' | 'retry' | 'manual_review';
}

interface QualityConfig {
  confidenceThreshold: number;
  maxRetries: number;
  enableAutoRetry: boolean;
}

const DEFAULT_CONFIG: QualityConfig = {
  confidenceThreshold: 0.6,
  maxRetries: 2,
  enableAutoRetry: true,
};

export class QualityAgent implements Agent {
  name = 'Quality';
  
  private config: QualityConfig;
  private retryCount: Map<string, number> = new Map();
  private qualityStats = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    retried: 0,
  };
  
  constructor(config: Partial<QualityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  async start(): Promise<void> {
    console.log(`[Quality] Starting with threshold: ${this.config.confidenceThreshold}`);
  }
  
  async stop(): Promise<void> {
    console.log('[Quality] Stopping...');
  }
  
  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    return {
      healthy: true,
      details: {
        config: this.config,
        stats: this.qualityStats,
      },
    };
  }
  
  /**
   * Check the quality of an analysis result
   */
  check(result: AnalysisResult): QualityCheck {
    this.qualityStats.totalChecks++;
    
    const issues: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    // Check 1: Confidence threshold
    if (result.confidence < this.config.confidenceThreshold) {
      issues.push(`Low confidence: ${(result.confidence * 100).toFixed(1)}%`);
      severity = 'high';
    }
    
    // Check 2: Missing critical fields
    const analysis = result.analysis as unknown as PropertyAnalysis;
    if (analysis) {
      if (typeof analysis.lawnSqft !== 'number') {
        issues.push('Missing lawnSqft');
        severity = 'high';
      }
      
      if (typeof analysis.treeCount !== 'number') {
        issues.push('Missing treeCount');
        severity = 'medium';
      }
      
      // Check 3: Suspicious values
      if (analysis.lawnSqft < 0 || analysis.lawnSqft > 1000000) {
        issues.push(`Suspicious lawnSqft: ${analysis.lawnSqft}`);
        severity = 'high';
      }
      
      if (analysis.treeCount < 0 || analysis.treeCount > 500) {
        issues.push(`Suspicious treeCount: ${analysis.treeCount}`);
        severity = 'medium';
      }
      
      if (analysis.fenceLength < 0 || analysis.fenceLength > 10000) {
        issues.push(`Suspicious fenceLength: ${analysis.fenceLength}`);
        severity = 'medium';
      }
    } else {
      issues.push('Analysis object is missing');
      severity = 'high';
    }
    
    // Determine recommendation
    let recommendation: 'accept' | 'retry' | 'manual_review' = 'accept';
    
    if (issues.length > 0) {
      if (severity === 'high') {
        recommendation = this.config.enableAutoRetry ? 'retry' : 'manual_review';
      } else if (severity === 'medium') {
        recommendation = 'accept'; // Accept with warnings
      }
    }
    
    const passed = issues.length === 0 || severity === 'low';
    
    if (passed) {
      this.qualityStats.passed++;
    } else {
      this.qualityStats.failed++;
    }
    
    console.log(`[Quality] Check: ${passed ? '✓' : '✗'} (${issues.length} issues, ${severity})`);
    
    return { passed, issues, severity, recommendation };
  }
  
  /**
   * Check if we should retry for a given request
   */
  shouldRetry(requestId: string): boolean {
    const count = this.retryCount.get(requestId) || 0;
    return count < this.config.maxRetries;
  }
  
  /**
   * Record a retry attempt
   */
  recordRetry(requestId: string): number {
    const count = (this.retryCount.get(requestId) || 0) + 1;
    this.retryCount.set(requestId, count);
    this.qualityStats.retried++;
    console.log(`[Quality] Retry ${count}/${this.config.maxRetries} for ${requestId}`);
    return count;
  }
  
  /**
   * Clear retry count (on success or final failure)
   */
  clearRetry(requestId: string): void {
    this.retryCount.delete(requestId);
  }
  
  /**
   * Merge results from multiple providers for consensus
   */
  mergeResults(results: AnalysisResult[]): AnalysisResult {
    if (results.length === 0) {
      throw new Error('No results to merge');
    }
    
    if (results.length === 1) {
      return results[0];
    }
    
    // Average numeric values, OR boolean values
    const analyses = results.map(r => r.analysis).filter(Boolean) as unknown as PropertyAnalysis[];
    
    const merged = {
      lawnSqft: Math.round(this.average(analyses.map(a => a.lawnSqft))),
      treeCount: Math.round(this.average(analyses.map(a => a.treeCount))),
      bushCount: Math.round(this.average(analyses.map(a => a.bushCount))),
      hasPool: analyses.some(a => a.hasPool),
      hasFence: analyses.some(a => a.hasFence),
      fenceLength: Math.max(...analyses.map(a => a.fenceLength || 0)),
      pathwaySqft: Math.round(this.average(analyses.map(a => a.pathwaySqft))),
      gardenBeds: Math.round(this.average(analyses.map(a => a.gardenBeds))),
      drivewayPresent: analyses.some(a => a.drivewayPresent),
      confidence: Math.min(0.98, this.average(results.map(r => r.confidence)) + 0.1),
      notes: results.flatMap(r => r.analysis?.notes || []),
    };
    
    return {
      requestId: results[0].requestId,
      provider: 'consensus',
      model: 'merged',
      analysis: merged,
      confidence: merged.confidence,
      latencyMs: Math.max(...results.map(r => r.latencyMs)),
    };
  }
  
  private average(nums: number[]): number {
    const valid = nums.filter(n => typeof n === 'number' && !isNaN(n));
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }
  
  /**
   * Get quality statistics
   */
  getStats(): typeof this.qualityStats {
    return { ...this.qualityStats };
  }
}
