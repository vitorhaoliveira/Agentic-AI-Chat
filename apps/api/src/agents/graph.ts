import type { AgentState } from './state.js';
import { generateCompletion } from '../services/llm.js';
import { getWeather } from '../tools/weather.js';
import { getCurrencyRate } from '../tools/currency.js';
import type { ToolResult } from '@agentic-ai-chat/shared';
import { createLogger } from '../config/logger.config.js';
import {
  buildRouterPrompt,
  buildLocationExtractionPrompt,
  buildCurrencyExtractionPrompt,
} from '../prompts/agent-prompts.js';

const logger = createLogger('agent-graph');

async function routerNode(state: AgentState): Promise<Partial<AgentState>> {
  const query = state.userQuery;

  logger.debug({ query }, 'Routing query');

  try {
    const routerPrompt = buildRouterPrompt(query);
    
    const decision = await generateCompletion([
      { role: 'system', content: 'You are a routing assistant. Answer with only one word.' },
      { role: 'user', content: routerPrompt },
    ]);

    const tool = decision.trim().toLowerCase();

    let nextStep = 'synthesize';
    
    if (tool.includes('weather')) {
      nextStep = 'weather';
    } else if (tool.includes('currency')) {
      nextStep = 'currency';
    }

    logger.info({ query, decision: nextStep }, 'Query routed');

    return {
      nextStep,
      context: {
        ...state.context,
        routingDecision: nextStep,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage, query }, 'Router error - falling back to synthesize');
    // Fallback to synthesize if routing fails
    return {
      nextStep: 'synthesize',
      context: {
        ...state.context,
        routingDecision: 'synthesize',
      },
    };
  }
}

async function weatherNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.debug({ query: state.userQuery }, 'Executing weather node');

  try {
    const query = state.userQuery;
    const extractPrompt = buildLocationExtractionPrompt(query);

    const location = await generateCompletion([
      { role: 'system', content: 'You extract locations from text. Return only the location name.' },
      { role: 'user', content: extractPrompt },
    ]);

    const cleanLocation = location.trim().replace(/['"]/g, '') || 'London';

    logger.info({ location: cleanLocation }, 'Fetching weather data');
    const weatherData = await getWeather(cleanLocation);

    const toolResult: ToolResult = {
      toolName: 'weather',
      result: weatherData,
      timestamp: Date.now(),
    };

    logger.info({ location: cleanLocation }, 'Weather data fetched successfully');

    return {
      toolResults: [...state.toolResults, toolResult],
      context: {
        ...state.context,
        weatherData,
      },
      nextStep: 'synthesize',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({ 
      error: errorMessage, 
      errorStack,
      query: state.userQuery 
    }, 'Weather node error');

    const toolResult: ToolResult = {
      toolName: 'weather',
      result: null,
      error: errorMessage,
      timestamp: Date.now(),
    };

    return {
      toolResults: [...state.toolResults, toolResult],
      nextStep: 'synthesize',
    };
  }
}

async function currencyNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.debug({ query: state.userQuery }, 'Executing currency node');

  try {
    const query = state.userQuery;
    const extractPrompt = buildCurrencyExtractionPrompt(query);

    const extracted = await generateCompletion([
      { role: 'system', content: 'You extract currency data. Return exactly: FROM:XXX TO:XXX AMOUNT:N' },
      { role: 'user', content: extractPrompt },
    ]);

    // Parse the response
    let from = 'USD';
    let to = 'BRL';
    let amount = 1;

    const fromMatch = extracted.match(/FROM:([A-Z]{3})/i);
    const toMatch = extracted.match(/TO:([A-Z]{3})/i);
    const amountMatch = extracted.match(/AMOUNT:(\d+(?:\.\d+)?)/i);

    if (fromMatch) from = fromMatch[1].toUpperCase();
    if (toMatch) to = toMatch[1].toUpperCase();
    if (amountMatch) amount = parseFloat(amountMatch[1]);

    logger.info({ from, to, amount }, 'Fetching currency rate');
    const currencyData = await getCurrencyRate(from, to, amount);

    const toolResult: ToolResult = {
      toolName: 'currency',
      result: currencyData,
      timestamp: Date.now(),
    };

    logger.info({ from, to, rate: currencyData.rate }, 'Currency rate fetched successfully');

    return {
      toolResults: [...state.toolResults, toolResult],
      context: {
        ...state.context,
        currencyData,
      },
      nextStep: 'synthesize',
    };
  } catch (error) {
    logger.error({ error }, 'Currency node error');

    const toolResult: ToolResult = {
      toolName: 'currency',
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };

    return {
      toolResults: [...state.toolResults, toolResult],
      nextStep: 'synthesize',
    };
  }
}

async function synthesizeNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.debug('Executing synthesize node');

  try {
    const toolResultsText = state.toolResults
      .map((tr) => {
        if (tr.error) {
          return `Tool ${tr.toolName} failed: ${tr.error}`;
        }
        return `Tool ${tr.toolName} result: ${JSON.stringify(tr.result, null, 2)}`;
      })
      .join('\n\n');

    // Import buildSystemPrompt from prompts
    const { buildSystemPrompt } = await import('../prompts/agent-prompts.js');
    
    const systemPrompt = buildSystemPrompt({
      toolResults: toolResultsText || 'No tools were used.',
    });

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: state.userQuery },
    ];

    const response = await generateCompletion(messages);

    logger.info({ responseLength: response.length }, 'Synthesis completed');

    return {
      finalResponse: response,
      nextStep: 'end',
    };
  } catch (error) {
    logger.error({ error }, 'Synthesis error');
    return {
      finalResponse: 'I encountered an error processing your request. Please try again.',
      nextStep: 'end',
    };
  }
}

export async function executeAgentTools(userQuery: string): Promise<AgentState> {
  logger.info({ query: userQuery }, 'Starting agent execution');

  let state: AgentState = {
    messages: [],
    userQuery,
    context: {},
    toolResults: [],
    nextStep: 'router',
    finalResponse: '',
  };

  let stepCount = 0;
  const maxSteps = 10; // Prevent infinite loops

  // Execute agent graph manually until synthesize step
  while (state.nextStep !== 'synthesize' && state.nextStep !== 'end' && stepCount < maxSteps) {
    stepCount++;
    let update: Partial<AgentState> = {};

    logger.debug({ step: state.nextStep, stepCount }, 'Executing agent step');

    switch (state.nextStep) {
      case 'router':
        update = await routerNode(state);
        break;
      case 'weather':
        update = await weatherNode(state);
        break;
      case 'currency':
        update = await currencyNode(state);
        break;
      default:
        logger.error({ step: state.nextStep }, 'Unknown agent step');
        state.nextStep = 'end';
        continue;
    }

    // Merge update into state
    state = { ...state, ...update };
  }

  if (stepCount >= maxSteps) {
    logger.warn('Agent execution reached max steps limit');
  }

  logger.info({ stepCount, toolResults: state.toolResults.length }, 'Agent execution completed');

  return state;
}

export async function executeAgent(userQuery: string): Promise<string> {
  const state = await executeAgentTools(userQuery);

  // Synthesize if needed
  if (state.nextStep === 'synthesize') {
    const update = await synthesizeNode(state);
    return update.finalResponse || 'No response generated.';
  }

  return state.finalResponse || 'No response generated.';
}

