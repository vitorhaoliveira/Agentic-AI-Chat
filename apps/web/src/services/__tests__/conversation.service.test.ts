import { describe, it, expect } from 'vitest';
import { conversationService } from '../conversation.service';
import type { Conversation } from '@agentic-ai-chat/shared';

describe('conversationService', () => {
  describe('generateTitle', () => {
    it('should return message if under max length', () => {
      const message = 'Short message';
      expect(conversationService.generateTitle(message)).toBe(message);
    });

    it('should truncate long messages', () => {
      const longMessage = 'a'.repeat(100);
      const result = conversationService.generateTitle(longMessage);
      
      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should trim whitespace', () => {
      const message = '  Message with spaces  ';
      expect(conversationService.generateTitle(message)).toBe('Message with spaces');
    });
  });

  describe('createNew', () => {
    it('should create a new conversation with default values', () => {
      const conv = conversationService.createNew();

      expect(conv).toHaveProperty('id');
      expect(conv.title).toBe('New Conversation');
      expect(conv.messages).toEqual([]);
      expect(conv.createdAt).toBeGreaterThan(0);
      expect(conv.updatedAt).toBeGreaterThan(0);
    });
  });

  describe('sortByRecent', () => {
    it('should sort conversations by updatedAt descending', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          title: 'Old',
          messages: [],
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: '2',
          title: 'Recent',
          messages: [],
          createdAt: 3000,
          updatedAt: 3000,
        },
        {
          id: '3',
          title: 'Middle',
          messages: [],
          createdAt: 2000,
          updatedAt: 2000,
        },
      ];

      const sorted = conversationService.sortByRecent(conversations);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
  });

  describe('filter', () => {
    it('should filter conversations by query', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          title: 'Weather in London',
          messages: [],
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: '2',
          title: 'Currency Exchange',
          messages: [],
          createdAt: 2000,
          updatedAt: 2000,
        },
      ];

      const filtered = conversationService.filter(conversations, 'weather');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should be case insensitive', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          title: 'Weather in London',
          messages: [],
          createdAt: 1000,
          updatedAt: 1000,
        },
      ];

      const filtered = conversationService.filter(conversations, 'WEATHER');

      expect(filtered).toHaveLength(1);
    });
  });
});

