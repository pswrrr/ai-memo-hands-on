/**
 * AI 요약 생성 서비스
 */

import { getGeminiClient } from './gemini';
import { GeminiError } from './types';
import { handleAIError, createAIError, AIErrorType } from './error-handler';
import { aiLogger } from '../utils/logger';
import { tokenTracker } from './token-tracker';

// 요약 결과 타입
export interface SummaryResult {
  summary: string;
  bulletPoints: string[];
  quality: number;
  processingTime: number;
}

// 요약 품질 평가 결과
export interface QualityAssessment {
  score: number;
  criteria: {
    completeness: number;
    clarity: number;
    relevance: number;
    structure: number;
  };
}

/**
 * 요약 생성 서비스 클래스
 */
export class SummarizerService {
  private geminiClient = getGeminiClient();

  /**
   * 노트 내용을 요약으로 변환
   */
  async generateSummary(
    content: string, 
    title?: string, 
    options?: { temperature?: number },
    context?: { userId?: string; noteId?: string }
  ): Promise<SummaryResult> {
    const startTime = Date.now();
    
    try {
      // 요청 로깅
      await aiLogger.request({
        type: 'summary_generation',
        contentLength: content.length,
        title,
        temperature: options?.temperature
      }, context);

      // 토큰 제한 검증
      const truncatedContent = this.truncateContent(content);
      
      // 요약 프롬프트 생성
      const prompt = this.createSummaryPrompt(truncatedContent, title);
      
      // Gemini API 호출
      const response = await this.geminiClient.generateContent({
        content: prompt,
        temperature: options?.temperature || 0.3
      });

      if (!response.text) {
        const error = createAIError(
          new Error('AI가 빈 응답을 반환했습니다.'),
          AIErrorType.API_ERROR,
          { operation: 'summary_generation', ...context }
        );
        await aiLogger.error(error, context);
        throw error;
      }

      // 불릿 포인트 추출
      const bulletPoints = this.extractBulletPoints(response.text);
      
      // 품질 평가
      const quality = await this.assessQuality(content, bulletPoints);
      
      const processingTime = Date.now() - startTime;

      const result = {
        summary: response.text,
        bulletPoints,
        quality: quality.score,
        processingTime
      };

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
          operation: 'summary_generation',
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
        operation: 'summary_generation',
        ...context
      });
      
      await aiLogger.error(error, {
        operation: 'summary_generation',
        processingTime: Date.now() - startTime,
        ...context
      });

      // 에러 발생 시에도 토큰 사용량 기록 (실패한 요청도 추적)
      if (context?.userId) {
        await tokenTracker.recordTokenUsage({
          userId: context.userId,
          noteId: context.noteId,
          model: 'gemini-2.0-flash-exp',
          operation: 'summary_generation',
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

  /**
   * 요약 프롬프트 생성
   */
  private createSummaryPrompt(content: string, title?: string): string {
    const basePrompt = `다음 노트를 3-6개의 불릿 포인트로 요약해주세요. 각 포인트는 핵심 내용을 간결하게 표현해야 합니다.

요약 형식:
• 첫 번째 핵심 내용
• 두 번째 핵심 내용
• 세 번째 핵심 내용
...`;

    if (title) {
      return `${basePrompt}

제목: ${title}
내용: ${content}`;
    }

    return `${basePrompt}

내용: ${content}`;
  }

  /**
   * 불릿 포인트 추출
   */
  private extractBulletPoints(summary: string): string[] {
    const lines = summary.split('\n');
    const bulletPoints: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        // 불릿 포인트 기호 제거
        const cleanPoint = trimmed.replace(/^[•\-*]\s*/, '').trim();
        if (cleanPoint.length > 0) {
          bulletPoints.push(cleanPoint);
        }
      }
    }

    return bulletPoints;
  }

  /**
   * 내용을 토큰 제한에 맞게 자르기
   */
  private truncateContent(content: string): string {
    // 프롬프트 길이를 고려하여 실제 내용은 더 짧게 자르기
    const maxContentLength = 6000; // 프롬프트 + 여유분을 고려
    
    if (content.length <= maxContentLength) {
      return content;
    }

    // 문장 단위로 자르기
    const sentences = content.split(/[.!?]+/);
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length > maxContentLength) {
        break;
      }
      truncated += sentence + '.';
    }

    return truncated || content.substring(0, maxContentLength);
  }

  /**
   * 요약 품질 평가
   */
  private async assessQuality(originalContent: string, bulletPoints: string[]): Promise<QualityAssessment> {
    try {
      // 기본 품질 평가 (간단한 휴리스틱)
      const completeness = this.assessCompleteness(originalContent, bulletPoints);
      const clarity = this.assessClarity(bulletPoints);
      const relevance = this.assessRelevance(originalContent, bulletPoints);
      const structure = this.assessStructure(bulletPoints);

      const score = (completeness + clarity + relevance + structure) / 4;

      return {
        score,
        criteria: {
          completeness,
          clarity,
          relevance,
          structure
        }
      };
    } catch (error) {
      console.warn('품질 평가 실패, 기본값 사용:', error);
      return {
        score: 0.8, // 기본 점수
        criteria: {
          completeness: 0.8,
          clarity: 0.8,
          relevance: 0.8,
          structure: 0.8
        }
      };
    }
  }

  /**
   * 완성도 평가
   */
  private assessCompleteness(originalContent: string, bulletPoints: string[]): number {
    const originalWords = originalContent.toLowerCase().split(/\s+/).length;
    const summaryWords = bulletPoints.join(' ').toLowerCase().split(/\s+/).length;
    
    // 요약이 원본의 10-30% 정도면 적절
    const ratio = summaryWords / originalWords;
    if (ratio >= 0.1 && ratio <= 0.3) {
      return 1.0;
    } else if (ratio >= 0.05 && ratio <= 0.5) {
      return 0.8;
    } else {
      return 0.6;
    }
  }

  /**
   * 명확성 평가
   */
  private assessClarity(bulletPoints: string[]): number {
    let clarityScore = 0;
    
    for (const point of bulletPoints) {
      // 문장 길이 (너무 짧거나 길면 감점)
      if (point.length < 10) {
        clarityScore += 0.3;
      } else if (point.length > 100) {
        clarityScore += 0.7;
      } else {
        clarityScore += 1.0;
      }
    }
    
    return clarityScore / bulletPoints.length;
  }

  /**
   * 관련성 평가
   */
  private assessRelevance(originalContent: string, bulletPoints: string[]): number {
    const originalKeywords = this.extractKeywords(originalContent);
    let relevanceScore = 0;
    
    for (const point of bulletPoints) {
      const pointKeywords = this.extractKeywords(point);
      const commonKeywords = originalKeywords.filter(keyword => 
        pointKeywords.includes(keyword)
      );
      
      const relevance = commonKeywords.length / Math.max(originalKeywords.length, 1);
      relevanceScore += Math.min(relevance, 1.0);
    }
    
    return relevanceScore / bulletPoints.length;
  }

  /**
   * 구조 평가
   */
  private assessStructure(bulletPoints: string[]): number {
    if (bulletPoints.length < 3) return 0.5;
    if (bulletPoints.length > 6) return 0.7;
    return 1.0;
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 20); // 상위 20개 키워드만
  }
}

/**
 * 전역 요약 서비스 인스턴스
 */
export const summarizerService = new SummarizerService();
