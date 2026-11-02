/**
 * Kimi K3 Tokenizer & XTML Segment Formatter
 * Faithfully mirrors src/chat/k3_chat.c and src/tokenizer/k3_tok.h
 */

export const SPECIAL_TOKENS = {
  BEGIN_THOUGHT: '<|begin_of_thought|>',
  END_THOUGHT: '<|end_of_thought|>',
  BEGIN_SOLUTION: '<|begin_of_solution|>',
  END_SOLUTION: '<|end_of_solution|>',
  END_OF_MSG: '<|end_of_msg|>', // 163586 in config.json
  EOS: '[EOS]'                  // 163585 in tokenizer_config.json
};

export const COMMON_VOCAB: Record<string, number> = {
  'The': 1008,
  ' capital': 10484,
  ' of': 318,
  ' France': 15383,
  ' is': 387,
  ' Paris': 17374,
  '.': 13,
  ' def': 756,
  ' fibonacci': 20829,
  '(n):': 1045,
  'Hello': 15496,
  '!': 0,
  ' My': 2649,
  ' name': 836,
  ' cache': 6414,
  ' locality': 34918,
  '<|begin_of_thought|>': 163580,
  '<|end_of_thought|>': 163581,
  '<|begin_of_solution|>': 163582,
  '<|end_of_solution|>': 163583,
  '<|end_of_msg|>': 163586,
  '[EOS]': 163585
};

export const REVERSE_VOCAB: Record<number, string> = Object.entries(COMMON_VOCAB).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k }),
  {}
);

/**
 * Tokenize a text string into an array of simulated token IDs and pieces.
 */
export function tokenizeText(text: string): { id: number; text: string }[] {
  if (!text) return [];

  // Match known phrases or word boundaries
  const words = text.match(/\s+[\w\d]+|[\w\d]+|[^\w\s\d]|\s+/g) || [text];
  let currentId = 5000;

  return words.map(piece => {
    if (COMMON_VOCAB[piece]) {
      return { id: COMMON_VOCAB[piece], text: piece };
    }
    // Generate deterministic ID from piece
    let hash = 0;
    for (let i = 0; i < piece.length; i++) {
      hash = ((hash << 5) - hash) + piece.charCodeAt(i);
      hash |= 0;
    }
    const pseudoId = 1000 + Math.abs(hash % 90000);
    return { id: pseudoId, text: piece };
  });
}

/**
 * Formats a chat history into the official XTML prompt format.
 */
export function formatXtmlPrompt(
  messages: { role: 'system' | 'user' | 'assistant'; content: string; reasoning_content?: string | null }[],
  thinking: boolean,
  thinkingEffort: string
): string {
  let prompt = '';

  for (const m of messages) {
    if (m.role === 'system') {
      prompt += `<|im_start|>system\n${m.content}\n<|im_end|>\n`;
    } else if (m.role === 'user') {
      prompt += `<|im_start|>user\n${m.content}\n<|im_end|>\n`;
    } else if (m.role === 'assistant') {
      prompt += `<|im_start|>assistant\n`;
      if (thinking && m.reasoning_content) {
        prompt += `${SPECIAL_TOKENS.BEGIN_THOUGHT}\n${m.reasoning_content}\n${SPECIAL_TOKENS.END_THOUGHT}\n`;
      }
      prompt += `${SPECIAL_TOKENS.BEGIN_SOLUTION}\n${m.content}\n${SPECIAL_TOKENS.END_SOLUTION}${SPECIAL_TOKENS.END_OF_MSG}\n<|im_end|>\n`;
    }
  }

  // Generation prompt
  prompt += `<|im_start|>assistant\n`;
  if (thinking) {
    prompt += `<!-- thinking_effort="${thinkingEffort}" -->\n${SPECIAL_TOKENS.BEGIN_THOUGHT}\n`;
  } else {
    prompt += `${SPECIAL_TOKENS.BEGIN_SOLUTION}\n`;
  }

  return prompt;
}
