/**
 * Suggestion Agent
 * Identifies improvements, optimizations, and new features
 * Sends suggestions to Site Manager for approval
 */

import { Agent, AnalysisResult, Metrics } from './types';

export type SuggestionCategory = 
  | 'performance'
  | 'accuracy'
  | 'cost'
  | 'feature'
  | 'reliability'
  | 'user_experience';

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  title: string;
  description: string;
  impact: string;
  implementation?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  approvedBy?: string;
  approvedAt?: Date;
}

interface SuggestionRules {
  minRequests: number; // Minimum requests before analyzing
  analysisInterval: number; // Ms between analyses
}

const DEFAULT_RULES: SuggestionRules = {
  minRequests: 10,
  analysisInterval: 300000, // 5 minutes
};

export class SuggestionAgent implements Agent {
  name = 'Suggestion';
  
  private suggestions: Suggestion[] = [];
  private rules: SuggestionRules;
  private lastAnalysis: Date | null = null;
  private suggestionCounter = 0;
  private onSuggestion?: (suggestion: Suggestion) => void;
  
  constructor(rules: Partial<SuggestionRules> = {}) {
    this.rules = { ...DEFAULT_RULES, ...rules };
  }
  
  async start(): Promise<void> {
    console.log('[Suggestion] Starting suggestion agent');
  }
  
  async stop(): Promise<void> {
    console.log('[Suggestion] Stopping...');
  }
  
  getStatus(): { healthy: boolean; details: any } {
    return {
      healthy: true,
      details: {
        pendingSuggestions: this.suggestions.filter(s => s.status === 'pending').length,
        totalSuggestions: this.suggestions.length,
        lastAnalysis: this.lastAnalysis,
      },
    };
  }
  
  /**
   * Set callback for new suggestions
   */
  onNewSuggestion(callback: (suggestion: Suggestion) => void): void {
    this.onSuggestion = callback;
  }
  
  /**
   * Analyze metrics and generate suggestions
   */
  analyzeMetrics(metrics: Metrics): Suggestion[] {
    const newSuggestions: Suggestion[] = [];
    
    // Check if we have enough data
    if (metrics.totalRequests < this.rules.minRequests) {
      return [];
    }
    
    // Performance suggestions
    if (metrics.averageLatencyMs > 15000) {
      newSuggestions.push(this.createSuggestion({
        category: 'performance',
        priority: 'high',
        title: 'High average latency detected',
        description: `Average response time is ${(metrics.averageLatencyMs / 1000).toFixed(1)}s, which may impact user experience.`,
        impact: 'Faster responses improve user satisfaction and conversion rates',
        implementation: 'Consider enabling request caching or using faster model variants',
      }));
    }
    
    // Rate limit suggestions
    if (metrics.rateLimitHits > 5) {
      newSuggestions.push(this.createSuggestion({
        category: 'reliability',
        priority: 'critical',
        title: 'Frequent rate limiting detected',
        description: `${metrics.rateLimitHits} rate limit hits recorded. Requests may be failing.`,
        impact: 'Rate limits cause request failures and poor user experience',
        implementation: 'Add additional API keys or implement request throttling',
      }));
    }
    
    // Error rate suggestions
    const errorRate = metrics.failedRequests / (metrics.totalRequests || 1);
    if (errorRate > 0.1) {
      newSuggestions.push(this.createSuggestion({
        category: 'reliability',
        priority: 'high',
        title: 'High error rate detected',
        description: `${(errorRate * 100).toFixed(1)}% of requests are failing.`,
        impact: 'Failed requests directly impact user experience',
        implementation: 'Review error logs and implement additional error handling',
      }));
    }
    
    // Provider-specific suggestions
    for (const [provider, pm] of Object.entries(metrics.byProvider)) {
      if (pm.requests > 5 && pm.avgLatency > 20000) {
        newSuggestions.push(this.createSuggestion({
          category: 'performance',
          priority: 'medium',
          title: `${provider} is slow`,
          description: `${provider} average latency is ${(pm.avgLatency / 1000).toFixed(1)}s`,
          impact: 'May be causing bottlenecks',
          implementation: `Consider deprioritizing ${provider} for time-sensitive requests`,
        }));
      }
    }
    
    // Cost optimization suggestions
    const openaiRate = metrics.byProvider.openai.requests / (metrics.totalRequests || 1);
    if (openaiRate > 0.7) {
      newSuggestions.push(this.createSuggestion({
        category: 'cost',
        priority: 'medium',
        title: 'High OpenAI usage',
        description: `${(openaiRate * 100).toFixed(0)}% of requests use OpenAI, which is more expensive.`,
        impact: 'Could reduce costs by 80% by using Gemini more',
        implementation: 'Adjust orchestrator to prefer Gemini for standard requests',
      }));
    }
    
    this.lastAnalysis = new Date();
    
    // Notify and store new suggestions
    for (const suggestion of newSuggestions) {
      this.suggestions.push(suggestion);
      if (this.onSuggestion) {
        this.onSuggestion(suggestion);
      }
    }
    
    return newSuggestions;
  }
  
  /**
   * Analyze result patterns for feature suggestions
   */
  analyzeResults(results: AnalysisResult[]): Suggestion[] {
    const newSuggestions: Suggestion[] = [];
    
    if (results.length < 5) return [];
    
    // Check for consistently low confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    if (avgConfidence < 0.7) {
      newSuggestions.push(this.createSuggestion({
        category: 'accuracy',
        priority: 'high',
        title: 'Low average confidence scores',
        description: `Average confidence is ${(avgConfidence * 100).toFixed(0)}%. AI may be struggling with image quality.`,
        impact: 'Low confidence leads to inaccurate quotes',
        implementation: 'Consider adding image preprocessing or requesting higher resolution images',
      }));
    }
    
    // Check for feature patterns
    const poolCount = results.filter(r => r.analysis?.hasPool).length;
    const poolRate = poolCount / results.length;
    if (poolRate > 0.3) {
      newSuggestions.push(this.createSuggestion({
        category: 'feature',
        priority: 'low',
        title: 'High pool detection rate',
        description: `${(poolRate * 100).toFixed(0)}% of properties have pools.`,
        impact: 'Consider adding pool-specific services or pricing',
        implementation: 'Add dedicated pool service options in the quote system',
      }));
    }
    
    return newSuggestions;
  }
  
  /**
   * Get pending suggestions
   */
  getPendingSuggestions(): Suggestion[] {
    return this.suggestions.filter(s => s.status === 'pending');
  }
  
  /**
   * Approve a suggestion
   */
  approveSuggestion(id: string, approver: string): boolean {
    const suggestion = this.suggestions.find(s => s.id === id);
    if (!suggestion) return false;
    
    suggestion.status = 'approved';
    suggestion.approvedBy = approver;
    suggestion.approvedAt = new Date();
    
    console.log(`[Suggestion] Approved: ${suggestion.title}`);
    return true;
  }
  
  /**
   * Reject a suggestion
   */
  rejectSuggestion(id: string): boolean {
    const suggestion = this.suggestions.find(s => s.id === id);
    if (!suggestion) return false;
    
    suggestion.status = 'rejected';
    console.log(`[Suggestion] Rejected: ${suggestion.title}`);
    return true;
  }
  
  /**
   * Mark a suggestion as implemented
   */
  markImplemented(id: string): boolean {
    const suggestion = this.suggestions.find(s => s.id === id);
    if (!suggestion) return false;
    
    suggestion.status = 'implemented';
    console.log(`[Suggestion] Implemented: ${suggestion.title}`);
    return true;
  }
  
  /**
   * Get all suggestions
   */
  getAllSuggestions(): Suggestion[] {
    return [...this.suggestions];
  }
  
  private createSuggestion(data: Omit<Suggestion, 'id' | 'createdAt' | 'status'>): Suggestion {
    return {
      id: `sug_${++this.suggestionCounter}_${Date.now()}`,
      ...data,
      createdAt: new Date(),
      status: 'pending',
    };
  }
}
