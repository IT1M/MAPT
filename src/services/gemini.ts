import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// Type Definitions
// ============================================================================

export interface InventoryTrend {
  product: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  recommendation: string;
}

export interface InventoryInsight {
  type: 'warning' | 'info' | 'success';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StockPrediction {
  product: string;
  currentStock: number;
  predictedNeed: number;
  timeframe: string;
  confidence: number;
}

export interface InventoryData {
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  averageUsage?: number;
  lastRestockDate?: Date;
}

export interface MonthlyData {
  month: string; // YYYY-MM format
  totalItems: number;
  totalQuantity: number;
  rejectCount: number;
  topProducts: Array<{
    name: string;
    quantity: number;
  }>;
  destinations: {
    MAIS: number;
    FOZAN: number;
  };
}

export interface MonthlyInsight {
  summary: string;
  keyFindings: string[];
  trends: string[];
  recommendations: string[];
  confidence: number;
}

export interface InventoryContext {
  totalItems: number;
  totalQuantity: number;
  recentActivity: Array<{
    itemName: string;
    quantity: number;
    destination: string;
    date: string;
  }>;
  lowStockItems?: Array<{
    itemName: string;
    currentStock: number;
    reorderPoint: number;
  }>;
  topCategories?: Array<{
    category: string;
    count: number;
  }>;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  confidence: number;
  sources?: string[];
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.DEFAULT_TTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RESET_TIMEOUT = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.RESET_TIMEOUT) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// ============================================================================
// Request Queue Implementation
// ============================================================================

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const task = this.queue.shift();
    
    if (task) {
      await task();
      // Add small delay between requests to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processQueue();
  }
}

// ============================================================================
// Gemini Service Implementation
// ============================================================================

export class GeminiService {
  private static instance: GeminiService | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private cache: ResponseCache;
  private circuitBreaker: CircuitBreaker;
  private requestQueue: RequestQueue;
  private retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff delays

  private constructor() {
    this.cache = new ResponseCache();
    this.circuitBreaker = new CircuitBreaker();
    this.requestQueue = new RequestQueue();
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('[GeminiService] GEMINI_API_KEY not found in environment variables');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('[GeminiService] Initialized successfully');
    } catch (error) {
      console.error('[GeminiService] Initialization error:', error);
    }
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private async callWithRetry<T>(
    fn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await this.circuitBreaker.execute(fn);
    } catch (error: any) {
      const isRateLimitError = 
        error?.message?.includes('429') || 
        error?.message?.includes('rate limit');

      if (isRateLimitError && retryCount < this.retryDelays.length) {
        const delay = this.retryDelays[retryCount];
        console.log(`[GeminiService] Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retryCount + 1);
      }

      throw error;
    }
  }

  private async generateContent(prompt: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    return this.requestQueue.enqueue(async () => {
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    });
  }

  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    // Sort keys for consistent cache key generation
    const sortedKeys = Object.keys(params).sort();
    const keyParts = sortedKeys.map(key => {
      const value = params[key];
      // Handle different types of values
      if (typeof value === 'object' && value !== null) {
        return `${key}:${JSON.stringify(value)}`;
      }
      return `${key}:${value}`;
    });
    
    return `${prefix}_${keyParts.join('_')}`;
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  async analyzeInventoryTrends(data: InventoryData[]): Promise<InventoryTrend[]> {
    const cacheKey = this.generateCacheKey('trends', { 
      products: data.map(d => ({ id: d.productId, stock: d.currentStock }))
    });
    const cached = this.cache.get<InventoryTrend[]>(cacheKey);
    
    if (cached) {
      console.log('[GeminiService] Returning cached trends');
      return cached;
    }

    try {
      const prompt = `Analyze the following medical inventory data and identify trends:

${data.map(item => `
Product: ${item.productName}
Current Stock: ${item.currentStock}
Min Level: ${item.minStockLevel}
Max Level: ${item.maxStockLevel}
Reorder Point: ${item.reorderPoint}
${item.averageUsage ? `Average Usage: ${item.averageUsage}` : ''}
`).join('\n')}

For each product, determine if the stock trend is increasing, decreasing, or stable.
Provide a confidence score (0-1) and a brief recommendation.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "product": "product name",
    "trend": "increasing|decreasing|stable",
    "confidence": 0.85,
    "recommendation": "brief recommendation"
  }
]`;

      const response = await this.callWithRetry(() => this.generateContent(prompt));
      
      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const trends: InventoryTrend[] = JSON.parse(jsonMatch[0]);
      this.cache.set(cacheKey, trends, 30); // 30-minute TTL for cost optimization
      
      console.log('[GeminiService] Trends analyzed successfully');
      return trends;

    } catch (error) {
      console.error('[GeminiService] Error analyzing trends:', error);
      return this.getFallbackTrends(data);
    }
  }

  async generateInsights(data: InventoryData[]): Promise<InventoryInsight[]> {
    const cacheKey = this.generateCacheKey('insights', { 
      products: data.map(d => ({ id: d.productId, stock: d.currentStock, reorder: d.reorderPoint }))
    });
    const cached = this.cache.get<InventoryInsight[]>(cacheKey);
    
    if (cached) {
      console.log('[GeminiService] Returning cached insights');
      return cached;
    }

    try {
      const prompt = `Analyze this medical inventory data and generate actionable insights:

${data.map(item => `
Product: ${item.productName}
Current Stock: ${item.currentStock}
Min Level: ${item.minStockLevel}
Max Level: ${item.maxStockLevel}
Reorder Point: ${item.reorderPoint}
`).join('\n')}

Identify:
- Critical low stock warnings (high priority)
- Overstocking issues (medium priority)
- Optimization opportunities (low priority)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "type": "warning|info|success",
    "message": "clear actionable message",
    "priority": "high|medium|low"
  }
]`;

      const response = await this.callWithRetry(() => this.generateContent(prompt));
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const insights: InventoryInsight[] = JSON.parse(jsonMatch[0]);
      this.cache.set(cacheKey, insights, 30); // 30-minute TTL for cost optimization
      
      console.log('[GeminiService] Insights generated successfully');
      return insights;

    } catch (error) {
      console.error('[GeminiService] Error generating insights:', error);
      return this.getFallbackInsights(data);
    }
  }

  async predictStockNeeds(data: InventoryData[]): Promise<StockPrediction[]> {
    const cacheKey = this.generateCacheKey('predictions', { 
      products: data.map(d => ({ id: d.productId, stock: d.currentStock, usage: d.averageUsage }))
    });
    const cached = this.cache.get<StockPrediction[]>(cacheKey);
    
    if (cached) {
      console.log('[GeminiService] Returning cached predictions');
      return cached;
    }

    try {
      const prompt = `Predict future stock needs for these medical products:

${data.map(item => `
Product: ${item.productName}
Current Stock: ${item.currentStock}
Min Level: ${item.minStockLevel}
Reorder Point: ${item.reorderPoint}
${item.averageUsage ? `Average Usage: ${item.averageUsage} units/month` : ''}
`).join('\n')}

For each product, predict the stock needed for the next 30 days.
Provide confidence scores (0-1) based on available data.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "product": "product name",
    "currentStock": 100,
    "predictedNeed": 150,
    "timeframe": "30 days",
    "confidence": 0.75
  }
]`;

      const response = await this.callWithRetry(() => this.generateContent(prompt));
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const predictions: StockPrediction[] = JSON.parse(jsonMatch[0]);
      this.cache.set(cacheKey, predictions, 30); // 30-minute TTL for cost optimization
      
      console.log('[GeminiService] Predictions generated successfully');
      return predictions;

    } catch (error) {
      console.error('[GeminiService] Error predicting stock needs:', error);
      return this.getFallbackPredictions(data);
    }
  }

  async generateMonthlyInsights(monthData: MonthlyData): Promise<MonthlyInsight> {
    const cacheKey = this.generateCacheKey('monthly_insights', { 
      month: monthData.month,
      totalItems: monthData.totalItems,
      totalQuantity: monthData.totalQuantity
    });
    const cached = this.cache.get<MonthlyInsight>(cacheKey);
    
    if (cached) {
      console.log('[GeminiService] Returning cached monthly insights');
      return cached;
    }

    try {
      const prompt = `Analyze this monthly medical inventory data and generate comprehensive insights:

Month: ${monthData.month}
Total Items: ${monthData.totalItems}
Total Quantity: ${monthData.totalQuantity}
Reject Count: ${monthData.rejectCount}
Reject Rate: ${((monthData.rejectCount / monthData.totalQuantity) * 100).toFixed(2)}%

Top Products:
${monthData.topProducts.map(p => `- ${p.name}: ${p.quantity} units`).join('\n')}

Distribution by Destination:
- MAIS: ${monthData.destinations.MAIS} units
- FOZAN: ${monthData.destinations.FOZAN} units

Provide:
1. A brief summary of the month's performance
2. 3-5 key findings about inventory patterns
3. 2-4 notable trends observed
4. 3-5 actionable recommendations for improvement

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "brief overview of the month",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "trends": ["trend 1", "trend 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "confidence": 0.85
}`;

      const response = await this.callWithRetry(() => this.generateContent(prompt));
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const insights: MonthlyInsight = JSON.parse(jsonMatch[0]);
      this.cache.set(cacheKey, insights, 30); // 30-minute TTL for cost optimization
      
      console.log('[GeminiService] Monthly insights generated successfully');
      return insights;

    } catch (error) {
      console.error('[GeminiService] Error generating monthly insights:', error);
      return this.getFallbackMonthlyInsights(monthData);
    }
  }

  async askQuestion(userQuery: string, context: InventoryContext): Promise<QuestionAnswer> {
    const cacheKey = this.generateCacheKey('qa', { 
      query: userQuery,
      totalItems: context.totalItems,
      totalQuantity: context.totalQuantity
    });
    const cached = this.cache.get<QuestionAnswer>(cacheKey);
    
    if (cached) {
      console.log('[GeminiService] Returning cached Q&A response');
      return cached;
    }

    try {
      const prompt = `You are an AI assistant for a medical inventory management system. Answer the user's question based on the provided inventory context.

Inventory Context:
- Total Items: ${context.totalItems}
- Total Quantity: ${context.totalQuantity}

Recent Activity:
${context.recentActivity.map(item => `- ${item.itemName}: ${item.quantity} units to ${item.destination} on ${item.date}`).join('\n')}

${context.lowStockItems && context.lowStockItems.length > 0 ? `
Low Stock Items:
${context.lowStockItems.map(item => `- ${item.itemName}: ${item.currentStock} units (reorder at ${item.reorderPoint})`).join('\n')}
` : ''}

${context.topCategories && context.topCategories.length > 0 ? `
Top Categories:
${context.topCategories.map(cat => `- ${cat.category}: ${cat.count} items`).join('\n')}
` : ''}

User Question: ${userQuery}

Provide a clear, concise answer based on the context. If the context doesn't contain enough information to answer the question, say so politely.

Return ONLY a valid JSON object with this exact structure:
{
  "question": "${userQuery.replace(/"/g, '\\"')}",
  "answer": "your detailed answer here",
  "confidence": 0.85,
  "sources": ["context data point 1", "context data point 2"]
}`;

      const response = await this.callWithRetry(() => this.generateContent(prompt));
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const answer: QuestionAnswer = JSON.parse(jsonMatch[0]);
      this.cache.set(cacheKey, answer, 30); // 30-minute TTL for cost optimization
      
      console.log('[GeminiService] Q&A response generated successfully');
      return answer;

    } catch (error) {
      console.error('[GeminiService] Error generating Q&A response:', error);
      return this.getFallbackAnswer(userQuery, context);
    }
  }

  // ============================================================================
  // Fallback Responses
  // ============================================================================

  private getFallbackTrends(data: InventoryData[]): InventoryTrend[] {
    console.log('[GeminiService] Using fallback trends');
    return data.map(item => {
      const stockRatio = item.currentStock / item.maxStockLevel;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (item.currentStock < item.reorderPoint) {
        trend = 'decreasing';
      } else if (stockRatio > 0.8) {
        trend = 'increasing';
      }

      return {
        product: item.productName,
        trend,
        confidence: 0.5,
        recommendation: trend === 'decreasing' 
          ? 'Consider reordering soon' 
          : trend === 'increasing'
          ? 'Stock levels are healthy'
          : 'Monitor stock levels',
      };
    });
  }

  private getFallbackInsights(data: InventoryData[]): InventoryInsight[] {
    console.log('[GeminiService] Using fallback insights');
    const insights: InventoryInsight[] = [];

    data.forEach(item => {
      if (item.currentStock < item.reorderPoint) {
        insights.push({
          type: 'warning',
          message: `${item.productName} is below reorder point (${item.currentStock}/${item.reorderPoint})`,
          priority: 'high',
        });
      } else if (item.currentStock > item.maxStockLevel) {
        insights.push({
          type: 'info',
          message: `${item.productName} is overstocked (${item.currentStock}/${item.maxStockLevel})`,
          priority: 'medium',
        });
      }
    });

    if (insights.length === 0) {
      insights.push({
        type: 'success',
        message: 'All inventory levels are within normal ranges',
        priority: 'low',
      });
    }

    return insights;
  }

  private getFallbackPredictions(data: InventoryData[]): StockPrediction[] {
    console.log('[GeminiService] Using fallback predictions');
    return data.map(item => {
      const averageUsage = item.averageUsage || item.reorderPoint * 0.5;
      const predictedNeed = Math.round(averageUsage * 1.2); // 20% buffer

      return {
        product: item.productName,
        currentStock: item.currentStock,
        predictedNeed,
        timeframe: '30 days',
        confidence: item.averageUsage ? 0.6 : 0.3,
      };
    });
  }

  private getFallbackMonthlyInsights(monthData: MonthlyData): MonthlyInsight {
    console.log('[GeminiService] Using fallback monthly insights');
    
    const rejectRate = (monthData.rejectCount / monthData.totalQuantity) * 100;
    const maisPercentage = (monthData.destinations.MAIS / monthData.totalQuantity) * 100;
    const fozanPercentage = (monthData.destinations.FOZAN / monthData.totalQuantity) * 100;
    
    const keyFindings: string[] = [
      `Processed ${monthData.totalItems} inventory items with ${monthData.totalQuantity} total units`,
      `Reject rate was ${rejectRate.toFixed(2)}%`,
      `Distribution: ${maisPercentage.toFixed(1)}% to MAIS, ${fozanPercentage.toFixed(1)}% to FOZAN`,
    ];

    if (monthData.topProducts.length > 0) {
      keyFindings.push(`Top product: ${monthData.topProducts[0].name} with ${monthData.topProducts[0].quantity} units`);
    }

    const trends: string[] = [];
    if (rejectRate > 5) {
      trends.push('Higher than expected reject rate observed');
    } else if (rejectRate < 2) {
      trends.push('Low reject rate indicates good quality control');
    }

    const recommendations: string[] = [];
    if (rejectRate > 5) {
      recommendations.push('Review quality control processes to reduce reject rate');
    }
    if (Math.abs(maisPercentage - fozanPercentage) > 30) {
      recommendations.push('Consider balancing distribution between MAIS and FOZAN');
    }
    recommendations.push('Continue monitoring inventory levels for optimization opportunities');

    return {
      summary: `In ${monthData.month}, the system processed ${monthData.totalItems} items totaling ${monthData.totalQuantity} units with a ${rejectRate.toFixed(2)}% reject rate.`,
      keyFindings,
      trends: trends.length > 0 ? trends : ['Inventory patterns appear stable'],
      recommendations,
      confidence: 0.5,
    };
  }

  private getFallbackAnswer(userQuery: string, context: InventoryContext): QuestionAnswer {
    console.log('[GeminiService] Using fallback Q&A response');
    
    let answer = 'I apologize, but I am currently unable to process your question. ';
    const sources: string[] = [];
    
    // Provide basic context-based responses
    if (userQuery.toLowerCase().includes('total') || userQuery.toLowerCase().includes('how many')) {
      answer = `Based on the current inventory data, there are ${context.totalItems} items with a total quantity of ${context.totalQuantity} units.`;
      sources.push('Total inventory count');
    } else if (userQuery.toLowerCase().includes('low stock') || userQuery.toLowerCase().includes('reorder')) {
      if (context.lowStockItems && context.lowStockItems.length > 0) {
        answer = `There are ${context.lowStockItems.length} items with low stock: ${context.lowStockItems.map(item => item.itemName).join(', ')}.`;
        sources.push('Low stock items list');
      } else {
        answer = 'All items appear to have adequate stock levels at this time.';
        sources.push('Stock level analysis');
      }
    } else if (userQuery.toLowerCase().includes('recent') || userQuery.toLowerCase().includes('activity')) {
      if (context.recentActivity.length > 0) {
        answer = `Recent activity includes: ${context.recentActivity.slice(0, 3).map(item => `${item.itemName} (${item.quantity} units)`).join(', ')}.`;
        sources.push('Recent activity log');
      } else {
        answer = 'No recent activity data is available.';
      }
    } else if (userQuery.toLowerCase().includes('category') || userQuery.toLowerCase().includes('categories')) {
      if (context.topCategories && context.topCategories.length > 0) {
        answer = `Top categories: ${context.topCategories.map(cat => `${cat.category} (${cat.count} items)`).join(', ')}.`;
        sources.push('Category breakdown');
      } else {
        answer = 'Category information is not available at this time.';
      }
    } else {
      answer += 'However, I can provide information about total inventory, low stock items, recent activity, and categories. Please try rephrasing your question.';
    }
    
    return {
      question: userQuery,
      answer,
      confidence: 0.4,
      sources: sources.length > 0 ? sources : undefined,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  public clearCache(): void {
    this.cache.clear();
    console.log('[GeminiService] Cache cleared');
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return this.cache.getCacheStats();
  }

  public getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }

  public isAvailable(): boolean {
    return this.genAI !== null && this.circuitBreaker.getState() !== 'OPEN';
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance();
