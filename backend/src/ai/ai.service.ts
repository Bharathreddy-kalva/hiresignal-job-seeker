import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { SignalData } from '../common/types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateSummary(signals: SignalData): Promise<string> {
    const prompt =
      `Based on these signals for ${signals.company}: ` +
      `${signals.jobs.jobs30d} jobs posted in 30 days, ` +
      `${signals.github.commits30d} GitHub commits in 30 days, ` +
      `${signals.news.length} recent news articles. ` +
      `In 2-3 sentences, tell a job seeker whether this company is worth applying to right now.`;

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are a concise job market analyst. Reply in 2-3 sentences only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('GROQ_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error('[AiService] Groq error response:', err.response?.data);
        console.error('[AiService] Groq error status:', err.response?.status);
      } else {
        console.error('[AiService] Unexpected error:', err);
      }
      this.logger.warn(
        `Groq API failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 'AI summary could not be generated at this time.';
    }
  }
}
