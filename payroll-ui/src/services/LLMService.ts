import * as webllm from '@mlc-ai/web-llm';
import pino from 'pino';

const logger = pino({
  name: 'llm-service',
  level: 'info',
  browser: {
    asObject: false,
  },
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  reasoning?: string; // Optional reasoning content from <think> tags
  answer?: string;    // Actual answer content (outside <think> tags)
}

export interface ParsedResponse {
  reasoning: string;
  answer: string;
}

/**
 * LLM Service for zkSalaria Payroll System
 * Uses WebLLM with Qwen model for in-browser AI assistance
 */
export class LLMService {
  private engine: webllm.MLCEngine | null = null;
  private isInitializing: boolean = false;
  private isInitialized: boolean = false;
  private conversationHistory: ChatMessage[] = [];

  /**
   * Parse response to separate reasoning from answer
   * Qwen 3 uses <think>...</think> tags for chain-of-thought reasoning
   */
  private parseResponse(fullText: string): ParsedResponse {
    const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);

    if (thinkMatch) {
      const reasoning = thinkMatch[1].trim();
      const answer = fullText.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      return { reasoning, answer };
    }

    // No thinking tags - entire response is the answer
    return { reasoning: '', answer: fullText.trim() };
  }

  // System prompt for payroll context
  private readonly SYSTEM_PROMPT = `You are an AI assistant for zkSalaria, a privacy-preserving payroll system built on Midnight blockchain.

**Your Role:**
- Help employees understand their income proofs and payroll information
- Guide users through generating zero-knowledge income proofs (Types 1-5)
- Explain privacy features and ZK-ML verification
- Assist with tax bracket proofs and income verification for loans/housing

**Available Proof Types:**
1. Type 1: Income Above Threshold - Prove minimum monthly income
2. Type 2: Income Range - Prove income falls within a range
3. Type 3: Average Income - Prove average income over 6 months
4. Type 4: Credit Score - Prove payment consistency score
5. Type 5: Tax Bracket - Prove income within US federal tax bracket

**Key Features:**
- All proofs use zero-knowledge cryptography (privacy-preserving)
- Income amounts remain encrypted on-chain
- Only you can decrypt your payment history
- Proofs can be shared with landlords, lenders, or government agencies
- Proofs expire after a set period for security

**Important:**
- Keep responses concise and helpful
- Use clear, non-technical language when explaining ZK concepts
- Always prioritize user privacy
- Never make up information about actual payment amounts or proofs`;

  /**
   * Initialize the WebLLM engine with Qwen model
   */
  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isInitialized) {
      logger.info('[LLM] Already initialized');
      return;
    }

    if (this.isInitializing) {
      logger.info('[LLM] Already initializing, waiting...');
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;

    try {
      logger.info('[LLM] Initializing WebLLM with Phi-3.5 model...');
      console.log('[LLM] About to call webllm.CreateMLCEngine...');

      // Using Phi-3.5-mini which is more stable than Qwen
      this.engine = await webllm.CreateMLCEngine('Phi-3.5-mini-instruct-q4f16_1-MLC', {
        initProgressCallback: (progress) => {
          const percent = progress.progress * 100;
          console.log(`[LLM] Progress callback fired: ${percent.toFixed(1)}%`, progress);
          logger.info(`[LLM] Loading: ${percent.toFixed(1)}%`);
          onProgress?.(progress.progress);
        },
      });

      console.log('[LLM] CreateMLCEngine returned successfully');

      this.isInitialized = true;
      logger.info('[LLM] Initialization complete');

      // Initialize conversation with system prompt
      this.conversationHistory = [
        {
          role: 'system',
          content: this.SYSTEM_PROMPT,
        },
      ];
    } catch (error) {
      logger.error('[LLM] Initialization failed:', error);
      throw new Error(`Failed to initialize LLM: ${error}`);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Send a message and get a streaming response
   */
  async *chat(userMessage: string): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isInitialized || !this.engine) {
      throw new Error('LLM not initialized. Call initialize() first.');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    logger.info('[LLM] User message:', userMessage);

    try {
      // Create streaming completion
      const completion = await this.engine.chat.completions.create({
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      let fullResponse = '';

      // Stream the response
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          yield {
            content: delta,
            done: false,
          };
        }
      }

      // Parse the complete response to separate reasoning and answer
      const parsed = this.parseResponse(fullResponse);

      // Add assistant response to history (full response including reasoning)
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
      });

      logger.info('[LLM] Response complete', {
        hasReasoning: !!parsed.reasoning,
        reasoningLength: parsed.reasoning.length,
        answerLength: parsed.answer.length,
      });

      // Final chunk with parsed reasoning and answer
      yield {
        content: '',
        done: true,
        reasoning: parsed.reasoning,
        answer: parsed.answer,
      };
    } catch (error) {
      logger.error('[LLM] Chat error:', error);
      throw new Error(`Chat failed: ${error}`);
    }
  }

  /**
   * Get a non-streaming response
   */
  async chatSync(userMessage: string): Promise<string> {
    if (!this.isInitialized || !this.engine) {
      throw new Error('LLM not initialized. Call initialize() first.');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const completion = await this.engine.chat.completions.create({
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const response = completion.choices[0]?.message?.content || '';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      return response;
    } catch (error) {
      logger.error('[LLM] Chat sync error:', error);
      throw new Error(`Chat failed: ${error}`);
    }
  }

  /**
   * Add context to the current conversation
   */
  addContext(context: string): void {
    this.conversationHistory.push({
      role: 'system',
      content: `Additional context: ${context}`,
    });
  }

  /**
   * Clear conversation history (keeps system prompt)
   */
  clearHistory(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: this.SYSTEM_PROMPT,
      },
    ];
    logger.info('[LLM] Conversation history cleared');
  }

  /**
   * Check if LLM is ready to use
   */
  isReady(): boolean {
    return this.isInitialized && this.engine !== null;
  }

  /**
   * Get initialization status
   */
  getStatus(): 'uninitialized' | 'initializing' | 'ready' {
    if (this.isInitialized) return 'ready';
    if (this.isInitializing) return 'initializing';
    return 'uninitialized';
  }
}

// Singleton instance
export const llmService = new LLMService();
