/**
 * Auto-Scaler Agent
 * Manages request queuing, worker pools, and rate limit handling
 */

import { Agent, AnalysisRequest, AnalysisResult, Priority } from './types';

interface QueuedRequest {
  request: AnalysisRequest;
  resolve: (result: AnalysisResult) => void;
  reject: (error: Error) => void;
  addedAt: Date;
}

export class AutoScalerAgent implements Agent {
  name = 'AutoScaler';
  
  private queue: QueuedRequest[] = [];
  private activeWorkers = 0;
  private maxConcurrent: number;
  private processing = false;
  private executor?: (request: AnalysisRequest) => Promise<AnalysisResult>;
  
  constructor(config: { maxConcurrent: number }) {
    this.maxConcurrent = config.maxConcurrent;
  }
  
  async start(): Promise<void> {
    console.log(`[AutoScaler] Starting with max ${this.maxConcurrent} concurrent workers`);
    this.processing = true;
    this.processQueue();
  }
  
  async stop(): Promise<void> {
    console.log('[AutoScaler] Stopping...');
    this.processing = false;
    // Reject all queued requests
    for (const item of this.queue) {
      item.reject(new Error('AutoScaler stopped'));
    }
    this.queue = [];
  }
  
  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    return {
      healthy: true,
      details: {
        queueDepth: this.queue.length,
        activeWorkers: this.activeWorkers,
        maxConcurrent: this.maxConcurrent,
        isProcessing: this.processing,
      },
    };
  }
  
  /**
   * Set the executor function for processing requests
   */
  setExecutor(executor: (request: AnalysisRequest) => Promise<AnalysisResult>): void {
    this.executor = executor;
  }
  
  /**
   * Submit a request to the queue
   */
  async submit(request: AnalysisRequest): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      const item: QueuedRequest = {
        request,
        resolve,
        reject,
        addedAt: new Date(),
      };
      
      // Priority queue insertion
      if (request.priority === 'urgent') {
        this.queue.unshift(item); // Add to front
      } else if (request.priority === 'high') {
        // Insert after urgent items
        const urgentCount = this.queue.filter(q => q.request.priority === 'urgent').length;
        this.queue.splice(urgentCount, 0, item);
      } else {
        this.queue.push(item); // Add to back
      }
      
      console.log(`[AutoScaler] Request ${request.id} queued (depth: ${this.queue.length})`);
      
      // Trigger processing
      this.processQueue();
    });
  }
  
  /**
   * Get current queue depth
   */
  getQueueDepth(): number {
    return this.queue.length;
  }
  
  /**
   * Get active worker count
   */
  getActiveWorkers(): number {
    return this.activeWorkers;
  }
  
  /**
   * Process items from the queue
   */
  private async processQueue(): Promise<void> {
    if (!this.processing || !this.executor) return;
    
    while (this.queue.length > 0 && this.activeWorkers < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) continue;
      
      this.activeWorkers++;
      
      // Process in background
      this.processItem(item).finally(() => {
        this.activeWorkers--;
        // Continue processing
        if (this.queue.length > 0) {
          this.processQueue();
        }
      });
    }
  }
  
  private async processItem(item: QueuedRequest): Promise<void> {
    const waitTime = Date.now() - item.addedAt.getTime();
    console.log(`[AutoScaler] Processing ${item.request.id} (waited ${waitTime}ms)`);
    
    try {
      const result = await this.executor!(item.request);
      item.resolve(result);
    } catch (error: unknown) {
      // Check for rate limiting - exponential backoff
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('Rate Limited') || errorMsg.includes('429')) {
        console.log(`[AutoScaler] Rate limited, re-queuing ${item.request.id}`);
        // Re-queue with delay
        setTimeout(() => {
          this.queue.push(item);
          this.processQueue();
        }, 30000); // 30 second delay
      } else {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  
  /**
   * Clear the queue
   */
  clearQueue(): number {
    const count = this.queue.length;
    for (const item of this.queue) {
      item.reject(new Error('Queue cleared'));
    }
    this.queue = [];
    return count;
  }
  
  /**
   * Get queue statistics
   */
  getStats(): {
    queueDepth: number;
    activeWorkers: number;
    byPriority: Record<Priority, number>;
    oldestWaitMs: number;
  } {
    const byPriority: Record<Priority, number> = {
      urgent: 0,
      high: 0,
      standard: 0,
      low: 0,
    };
    
    for (const item of this.queue) {
      byPriority[item.request.priority]++;
    }
    
    const oldestWaitMs = this.queue.length > 0
      ? Date.now() - this.queue[0].addedAt.getTime()
      : 0;
    
    return {
      queueDepth: this.queue.length,
      activeWorkers: this.activeWorkers,
      byPriority,
      oldestWaitMs,
    };
  }
}
