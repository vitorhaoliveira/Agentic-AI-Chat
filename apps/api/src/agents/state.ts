import type { Message, ToolResult } from '@agentic-ai-chat/shared';

export interface AgentState {
  messages: Message[];
  userQuery: string;
  context: Record<string, any>;
  toolResults: ToolResult[];
  nextStep: string;
  finalResponse: string;
}

export function createInitialState(userQuery: string): AgentState {
  return {
    messages: [],
    userQuery,
    context: {},
    toolResults: [],
    nextStep: 'router',
    finalResponse: '',
  };
}

