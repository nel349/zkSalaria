# 🤖 LLM Integration - Tax Bracket Proof Assistant

**Project:** zkSalaria - ZKML-Powered Private Payroll System
**Feature:** In-Browser LLM for Natural Language Proof Generation
**Model:** Qwen 3 (via web-llm)
**Purpose:** Simplify tax bracket proof generation through conversational AI

---

## Overview

Instead of manually selecting tax brackets and thresholds, employees can use natural language to describe their needs, and an in-browser LLM will automatically determine the correct proof parameters.

### Key Benefits

✅ **Privacy-First**: Runs entirely in browser (no server calls)
✅ **User-Friendly**: Natural language instead of technical forms
✅ **Context-Aware**: Understands program requirements
✅ **Educational**: Explains eligibility in plain language
✅ **Offline Capable**: Works without internet (after model loads)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Client-Side)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Input (Natural Language)                               │
│  "I need to prove I qualify for low-income housing"         │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Qwen 3 Model (via web-llm)                          │  │
│  │  - Loaded from CDN (cached)                          │  │
│  │  - Runs in WebGPU/WebAssembly                        │  │
│  │  - Size: ~2GB quantized (4-bit)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                     │                                        │
│                     ▼                                        │
│  LLM Output (Structured JSON)                                │
│  {                                                           │
│    "proof_type": 5,                                          │
│    "bracket": "12%",                                         │
│    "threshold_min": 11601,                                   │
│    "threshold_max": 47150,                                   │
│    "explanation": "Housing assistance requires...",          │
│    "confidence": 0.95                                        │
│  }                                                           │
│                     │                                        │
│                     ▼                                        │
│  GenerateProofModal (Auto-filled)                            │
│  - Proof Type: Tax Bracket (Type 5)                          │
│  - Bracket: 12% ($11,601 - $47,150)                          │
│  - [Generate Proof Button]                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Guide

### 1. Setup web-llm

Reference: https://github.com/mlc-ai/web-llm

```typescript
// src/services/LLMService.ts
import * as webllm from "@mlc-ai/web-llm";

export class TaxBracketLLM {
  private engine: webllm.MLCEngine | null = null;
  private loading = false;

  // Initialize LLM (runs once, cached)
  async initialize(): Promise<void> {
    if (this.engine) return;
    if (this.loading) {
      // Wait for existing load
      await this.waitForLoad();
      return;
    }

    this.loading = true;

    try {
      // Use Qwen 3 model (quantized 4-bit)
      this.engine = await webllm.CreateMLCEngine("Qwen2.5-1.5B-Instruct-q4f32_1", {
        initProgressCallback: (progress) => {
          console.log(`[LLM] Loading: ${(progress.progress * 100).toFixed(0)}%`);
        },
      });

      console.log("[LLM] Model loaded successfully");
    } catch (error) {
      console.error("[LLM] Failed to load model:", error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  // Wait for loading to complete
  private async waitForLoad(): Promise<void> {
    while (this.loading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Analyze user request and suggest proof parameters
  async analyzeTaxBracketRequest(userInput: string): Promise<TaxBracketSuggestion> {
    if (!this.engine) {
      throw new Error("LLM not initialized. Call initialize() first.");
    }

    const prompt = this.buildPrompt(userInput);

    const response = await this.engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 500,
    });

    const llmOutput = response.choices[0].message.content;
    return this.parseResponse(llmOutput);
  }

  // Build structured prompt
  private buildPrompt(userInput: string): string {
    return `You are a tax bracket assistant helping users generate income verification proofs.

US Federal Tax Brackets (2024):
1. 10%: $0 - $11,600
2. 12%: $11,601 - $47,150
3. 22%: $47,151 - $100,525
4. 24%: $100,526 - $191,950
5. 32%: $191,951 - $243,725
6. 35%: $243,726 - $609,350
7. 37%: $609,351+

Common Program Requirements:
- Housing assistance (Section 8): Income ≤ $50,000/year (12% bracket)
- Student loan forgiveness: Income ≤ $125,000/year (22-24% brackets)
- Medicaid: Income ≤ $20,000/year (10-12% brackets)
- EITC: Income $0 - $63,398 (10-22% brackets)

User Request: "${userInput}"

Analyze the request and respond with ONLY a JSON object (no markdown, no explanation):
{
  "proof_type": 5,
  "bracket_number": <1-7>,
  "bracket_rate": "<10%|12%|22%|24%|32%|35%|37%>",
  "threshold_min": <integer>,
  "threshold_max": <integer>,
  "explanation": "<why this bracket meets the requirement>",
  "programs": ["<list of programs this qualifies for>"],
  "confidence": <0.0-1.0>
}

Response:`;
  }

  // Parse LLM JSON response
  private parseResponse(llmOutput: string): TaxBracketSuggestion {
    try {
      // Extract JSON from response (handles markdown code blocks)
      const jsonMatch = llmOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        proofType: parsed.proof_type,
        bracketNumber: parsed.bracket_number,
        bracketRate: parsed.bracket_rate,
        thresholdMin: parsed.threshold_min,
        thresholdMax: parsed.threshold_max,
        explanation: parsed.explanation,
        programs: parsed.programs || [],
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      console.error("[LLM] Failed to parse response:", error);
      throw new Error("Invalid LLM response format");
    }
  }

  // Cleanup
  async dispose(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
    }
  }
}

export interface TaxBracketSuggestion {
  proofType: number;
  bracketNumber: number;
  bracketRate: string;
  thresholdMin: number;
  thresholdMax: number;
  explanation: string;
  programs: string[];
  confidence: number;
}
```

---

### 2. React Component Integration

```typescript
// src/components/LLMProofAssistant.tsx
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Alert, Paper, Typography } from '@mui/material';
import { TaxBracketLLM, type TaxBracketSuggestion } from '../services/LLMService';

export const LLMProofAssistant: React.FC<{
  onSuggestion: (suggestion: TaxBracketSuggestion) => void;
}> = ({ onSuggestion }) => {
  const [llm] = useState(() => new TaxBracketLLM());
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [suggestion, setSuggestion] = useState<TaxBracketSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize LLM on mount
  useEffect(() => {
    const init = async () => {
      try {
        await llm.initialize();
        setInitializing(false);
      } catch (err) {
        setError('Failed to load AI assistant. Please try manual mode.');
        setInitializing(false);
      }
    };

    init();

    return () => {
      llm.dispose();
    };
  }, []);

  const handleAnalyze = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await llm.analyzeTaxBracketRequest(userInput);
      setSuggestion(result);
      onSuggestion(result);
    } catch (err) {
      setError('Failed to analyze request. Please try again or use manual mode.');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Loading AI assistant...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        🤖 AI Proof Assistant (Optional)
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={3}
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Describe what you need... e.g., 'I need to prove I qualify for low-income housing assistance'"
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleAnalyze}
        disabled={!userInput.trim() || loading}
        fullWidth
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Analyzing...
          </>
        ) : (
          'Analyze & Suggest Proof'
        )}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {suggestion && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            Suggested: {suggestion.bracketRate} Tax Bracket
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {suggestion.explanation}
          </Typography>
          {suggestion.programs.length > 0 && (
            <Typography variant="caption">
              Programs: {suggestion.programs.join(', ')}
            </Typography>
          )}
        </Alert>
      )}
    </Paper>
  );
};
```

---

### 3. Integration with GenerateProofModal

```typescript
// src/components/GenerateProofModal.tsx
import { LLMProofAssistant } from './LLMProofAssistant';

export const GenerateProofModal: React.FC = () => {
  const [proofType, setProofType] = useState<number>(1);
  const [thresholdMin, setThresholdMin] = useState<string>('');
  const [thresholdMax, setThresholdMax] = useState<string>('');
  const [showLLM, setShowLLM] = useState(false);

  const handleLLMSuggestion = (suggestion: TaxBracketSuggestion) => {
    setProofType(suggestion.proofType);
    setThresholdMin(suggestion.thresholdMin.toString());
    setThresholdMax(suggestion.thresholdMax.toString());
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Generate Income Proof</DialogTitle>
      <DialogContent>
        {/* Toggle for LLM Assistant */}
        <FormControlLabel
          control={
            <Switch checked={showLLM} onChange={(e) => setShowLLM(e.target.checked)} />
          }
          label="Use AI Assistant"
        />

        {/* LLM Assistant */}
        {showLLM && (
          <LLMProofAssistant onSuggestion={handleLLMSuggestion} />
        )}

        {/* Manual Form (always visible) */}
        <TextField
          select
          fullWidth
          label="Proof Type"
          value={proofType}
          onChange={(e) => setProofType(Number(e.target.value))}
        >
          <MenuItem value={1}>Type 1: Income Above Threshold</MenuItem>
          <MenuItem value={2}>Type 2: Income Range</MenuItem>
          <MenuItem value={3}>Type 3: Average Income</MenuItem>
          <MenuItem value={4}>Type 4: Credit Score</MenuItem>
          <MenuItem value={5}>Type 5: Tax Bracket</MenuItem>
        </TextField>

        {/* Tax Bracket specific fields */}
        {proofType === 5 && (
          <>
            <TextField
              fullWidth
              label="Bracket Minimum"
              value={thresholdMin}
              onChange={(e) => setThresholdMin(e.target.value)}
            />
            <TextField
              fullWidth
              label="Bracket Maximum"
              value={thresholdMax}
              onChange={(e) => setThresholdMax(e.target.value)}
            />
          </>
        )}

        {/* Generate button */}
        <Button onClick={handleGenerate}>Generate Proof</Button>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Example Conversations

### Example 1: Housing Assistance

```
User: "I need to prove I'm eligible for Section 8 housing"

LLM Response:
{
  "proof_type": 5,
  "bracket_number": 2,
  "bracket_rate": "12%",
  "threshold_min": 11601,
  "threshold_max": 47150,
  "explanation": "Section 8 housing assistance typically requires income at or below 80% of Area Median Income. The 12% tax bracket (max $47,150) falls well within this range for most areas, demonstrating eligibility without revealing your exact salary.",
  "programs": ["Section 8", "Low-Income Housing Tax Credit", "Public Housing"],
  "confidence": 0.95
}

UI: Auto-fills form with 12% bracket ($11,601 - $47,150)
```

### Example 2: Student Loan Forgiveness

```
User: "Prove income for student loan forgiveness program"

LLM Response:
{
  "proof_type": 5,
  "bracket_number": 3,
  "bracket_rate": "22%",
  "threshold_min": 47151,
  "threshold_max": 100525,
  "explanation": "Income-driven repayment plans for student loans consider your discretionary income. The 22% tax bracket (max $100,525) qualifies for most IDR plans, which typically have income caps around $125,000.",
  "programs": ["PAYE", "REPAYE", "IBR", "ICR"],
  "confidence": 0.88
}

UI: Auto-fills form with 22% bracket ($47,151 - $100,525)
```

### Example 3: Medicaid

```
User: "I want to see if I qualify for Medicaid in my state"

LLM Response:
{
  "proof_type": 5,
  "bracket_number": 1,
  "bracket_rate": "10%",
  "threshold_min": 0,
  "threshold_max": 11600,
  "explanation": "Medicaid eligibility varies by state but typically requires income below 138% of the Federal Poverty Level (around $20,000/year for a single individual). The 10% tax bracket (max $11,600) demonstrates clear eligibility.",
  "programs": ["Medicaid", "CHIP", "Emergency Medicaid"],
  "confidence": 0.92
}

UI: Auto-fills form with 10% bracket ($0 - $11,600)
```

---

## Performance Considerations

### Model Loading

- **First Load**: 10-30 seconds (downloads ~2GB model)
- **Cached**: Instant (model cached in browser)
- **Memory**: ~2.5GB RAM required
- **Storage**: ~2GB IndexedDB

### Inference Speed

- **WebGPU (Modern GPU)**: 0.5-2 seconds
- **WebGPU (Integrated GPU)**: 2-5 seconds
- **WASM Fallback**: 5-15 seconds

### Browser Support

✅ **Supported:**
- Chrome/Edge 113+ (WebGPU)
- Safari 17+ (WebGPU)
- Firefox 121+ (WebGPU behind flag)

❌ **Not Supported:**
- Mobile browsers (insufficient memory)
- Older browsers (no WebGPU)

### Fallback Strategy

```typescript
// Feature detection
const supportsWebGPU = 'gpu' in navigator;
const hasEnoughMemory = navigator.deviceMemory >= 4; // 4GB minimum

const enableLLM = supportsWebGPU && hasEnoughMemory;

if (!enableLLM) {
  // Show manual mode only
  console.warn('[LLM] Browser does not support AI assistant. Using manual mode.');
}
```

---

## Security & Privacy

### ✅ Privacy Guarantees

1. **No Server Calls**: Model runs 100% in browser
2. **No Data Logging**: User input never leaves device
3. **No Telemetry**: Zero tracking or analytics
4. **Offline Capable**: Works without internet (after initial load)

### ⚠️ Considerations

1. **Model Bias**: LLM may suggest incorrect brackets
   - **Mitigation**: Always show manual override
   - **Mitigation**: Display confidence score
   - **Mitigation**: User confirms before submitting

2. **Prompt Injection**: User could try to manipulate LLM
   - **Mitigation**: Strict JSON parsing
   - **Mitigation**: Validate output against tax bracket rules
   - **Mitigation**: Low temperature (0.1) for consistent output

3. **Browser Compatibility**: Not all users can run LLM
   - **Mitigation**: LLM is optional, not required
   - **Mitigation**: Manual mode always available

---

## Testing

### Unit Tests

```typescript
// LLMService.test.ts
describe('TaxBracketLLM', () => {
  let llm: TaxBracketLLM;

  beforeAll(async () => {
    llm = new TaxBracketLLM();
    await llm.initialize();
  });

  afterAll(async () => {
    await llm.dispose();
  });

  it('should suggest correct bracket for housing assistance', async () => {
    const result = await llm.analyzeTaxBracketRequest(
      'I need to prove I qualify for low-income housing'
    );

    expect(result.bracketNumber).toBeLessThanOrEqual(2); // 10% or 12%
    expect(result.thresholdMax).toBeLessThanOrEqual(50000);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should handle invalid input gracefully', async () => {
    const result = await llm.analyzeTaxBracketRequest(
      'Hello world xyz nonsense'
    );

    expect(result.confidence).toBeLessThan(0.5);
  });
});
```

---

## Future Enhancements

### Phase 2 (Post-Launch)

1. **Multi-Turn Conversation**: Ask clarifying questions
2. **Custom Program Database**: Load program requirements from API
3. **State-Specific Rules**: Handle varying state income limits
4. **Document Analysis**: Upload pay stubs for automatic calculation
5. **Voice Input**: Speech-to-text integration

### Phase 3 (Advanced)

1. **Fine-Tuned Model**: Custom model trained on tax/eligibility data
2. **Multi-Language**: Support Spanish, Chinese, etc.
3. **Comparison Mode**: Compare multiple programs side-by-side
4. **Eligibility Calculator**: Predict qualification likelihood

---

## Cost Analysis

### Development

- **Model Selection**: $0 (open-source Qwen 3)
- **Hosting**: $0 (runs in browser)
- **API Costs**: $0 (no server inference)

### User Costs

- **Bandwidth**: ~2GB (one-time download, cached)
- **Compute**: User's device (GPU/CPU)
- **Storage**: ~2GB browser storage

**Total Cost to zkSalaria: $0** 🎉

---

## Implementation Timeline

- **Week 1**: Basic LLM service integration
- **Week 2**: UI components + prompt engineering
- **Week 3**: Testing + optimization
- **Week 4**: Production deployment

---

## References

- **web-llm**: https://github.com/mlc-ai/web-llm
- **Qwen Models**: https://huggingface.co/Qwen
- **WebGPU Spec**: https://www.w3.org/TR/webgpu/
- **WebLLM Demo**: https://webllm.mlc.ai/

---

**Last Updated**: November 13, 2025
**Version**: 1.0
**Status**: 🚧 Design Phase - Implementation Pending
