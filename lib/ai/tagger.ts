/**
 * AI 태그 생성 서비스
 */

import { getGeminiClient } from './gemini';
import { GeminiError, TaggingResult } from './types';
import { handleAIError, createAIError, AIErrorType } from './error-handler';
import { aiLogger } from '../utils/logger';
import { tokenTracker } from './token-tracker';

export class TaggerService {
  private geminiClient = getGeminiClient();

  async generateTags(
    content: string, 
    title?: string,
    context?: { userId?: string; noteId?: string }
  ): Promise<TaggingResult> {
    const startTime = Date.now();

    try {
      // 요청 로깅
      await aiLogger.request({
        type: 'tag_generation',
        contentLength: content.length,
        title
      }, context);

      const prompt = this.createTagPrompt(content, title);
      const response = await this.geminiClient.generateContent({ content: prompt });

      if (!response.text) {
        const error = createAIError(
          new Error('AI가 빈 응답을 반환했습니다.'),
          AIErrorType.API_ERROR,
          { operation: 'tag_generation', ...context }
        );
        await aiLogger.error(error, context);
        throw error;
      }

      const tags = this.extractTags(response.text);
      const processingTime = Date.now() - startTime;

      const result = { tags: tags.slice(0, 6), processingTime };

      // 성공 로깅
      await aiLogger.response({
        success: true,
        processingTime,
        tokenUsage: response.usage
      }, context);

      // 토큰 사용량 기록
      if (response.usage && context?.userId) {
        await tokenTracker.recordTokenUsage({
          userId: context.userId,
          noteId: context.noteId,
          model: 'gemini-2.0-flash-exp',
          operation: 'tag_generation',
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          processingTime,
          success: true
        });
      }

      return result;
    } catch (error) {
      // 에러 처리 및 로깅
      const errorResult = await handleAIError(error, {
        operation: 'tag_generation',
        ...context
      });
      
      await aiLogger.error(error, {
        operation: 'tag_generation',
        processingTime: Date.now() - startTime,
        ...context
      });

      // 에러 발생 시에도 토큰 사용량 기록 (실패한 요청도 추적)
      if (context?.userId) {
        await tokenTracker.recordTokenUsage({
          userId: context.userId,
          noteId: context.noteId,
          model: 'gemini-2.0-flash-exp',
          operation: 'tag_generation',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw errorResult.error || createAIError(error, AIErrorType.UNKNOWN, context);
    }
  }

  private createTagPrompt(content: string, title?: string): string {
    const base = `다음 노트의 내용을 바탕으로 관련성이 높은 태그를 최대 6개 생성해 주세요.\n- 각 태그는 1~3개의 단어로 간결하게\n- 중복/동의어는 피하기\n- 쉼표(,)로 구분된 한 줄로만 출력\n`;
    if (title) {
      return `${base}\n제목: ${title}\n내용: ${content}`;
    }
    return `${base}\n내용: ${content}`;
  }

  private extractTags(text: string): string[] {
    // 쉼표 구분 또는 줄바꿈 구분 대응
    const raw = text.includes(',') ? text.split(',') : text.split('\n');
    return raw
      .map(t => t.trim().replace(/^[-•#]+\s*/, ''))
      .filter(t => t.length > 0)
      .map(t => t.replace(/^tag:\s*/i, ''))
      .map(t => t.replace(/\s{2,}/g, ' '))
      .map(t => t.toLowerCase())
      .filter((t, i, arr) => arr.indexOf(t) === i);
  }
}

export const taggerService = new TaggerService();


