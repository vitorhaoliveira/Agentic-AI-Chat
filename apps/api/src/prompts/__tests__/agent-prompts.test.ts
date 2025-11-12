import { describe, it, expect } from 'vitest';
import {
  buildRouterPrompt,
  buildLocationExtractionPrompt,
  buildCurrencyExtractionPrompt,
  buildSystemPrompt,
  buildPdfContextMessage,
  buildPdfErrorMessage,
  SYSTEM_INSTRUCTIONS,
} from '../agent-prompts.js';

describe('Agent Prompts', () => {
  describe('buildRouterPrompt', () => {
    it('should build a router prompt with the query', () => {
      const query = 'What is the weather in London?';
      const prompt = buildRouterPrompt(query);

      expect(prompt).toContain(query);
      expect(prompt).toContain('weather');
      expect(prompt).toContain('currency');
      expect(prompt).toContain('none');
    });
  });

  describe('buildLocationExtractionPrompt', () => {
    it('should build a location extraction prompt', () => {
      const query = 'How is the weather in Paris?';
      const prompt = buildLocationExtractionPrompt(query);

      expect(prompt).toContain(query);
      expect(prompt).toContain('location');
    });
  });

  describe('buildCurrencyExtractionPrompt', () => {
    it('should build a currency extraction prompt', () => {
      const query = 'Convert 100 USD to EUR';
      const prompt = buildCurrencyExtractionPrompt(query);

      expect(prompt).toContain(query);
      expect(prompt).toContain('FROM:');
      expect(prompt).toContain('TO:');
      expect(prompt).toContain('AMOUNT:');
    });
  });

  describe('buildSystemPrompt', () => {
    it('should build system prompt with tool results', () => {
      const prompt = buildSystemPrompt({
        toolResults: 'Weather data: 25°C',
      });

      expect(prompt).toContain('Weather data: 25°C');
      expect(prompt).toContain('IMPORTANT INSTRUCTIONS');
    });

    it('should build system prompt without tool results', () => {
      const prompt = buildSystemPrompt({});

      expect(prompt).toContain('No tools were used');
    });

    it('should include all instructions', () => {
      const prompt = buildSystemPrompt({});

      expect(prompt).toContain(SYSTEM_INSTRUCTIONS.weather);
      expect(prompt).toContain(SYSTEM_INSTRUCTIONS.currency);
      expect(prompt).toContain(SYSTEM_INSTRUCTIONS.pdf);
    });
  });

  describe('buildPdfContextMessage', () => {
    it('should build PDF context with full text', () => {
      const filename = 'test.pdf';
      const text = 'This is a test PDF content.';
      
      const message = buildPdfContextMessage(filename, text);

      expect(message).toContain(filename);
      expect(message).toContain(text);
      expect(message).toContain('ATTACHED PDF DOCUMENT');
    });

    it('should truncate long text', () => {
      const filename = 'long.pdf';
      const longText = 'a'.repeat(10000);
      
      const message = buildPdfContextMessage(filename, longText, 100);

      expect(message).toContain('...');
      expect(message.length).toBeLessThan(longText.length + 100);
    });
  });

  describe('buildPdfErrorMessage', () => {
    it('should build PDF error message', () => {
      const filename = 'scanned.pdf (⚠️ No text found - may be scanned)';
      
      const message = buildPdfErrorMessage(filename);

      expect(message).toContain('scanned.pdf');
      expect(message).not.toContain('⚠️');
      expect(message).toContain('PDF ATTACHMENT ISSUE');
      expect(message).toContain('scanned document');
    });
  });
});

