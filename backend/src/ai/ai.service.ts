import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { SignalData } from '../common/types';

interface GroqResponse {
  choices: Array<{ message: { content: string } }>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly groqUrl =
    'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama3-8b-8192';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('GROQ_API_KEY');
  }

  async generateSummary(signals: SignalData): Promise<string> {
    const newsLines =
      signals.news.length > 0
        ? signals.news
            .map(
              (n, i) =>
                `${i + 1}. ${n.title} (${n.source}, ${n.publishedAt?.slice(0, 10)})`,
            )
            .join('\n')
        : 'No recent news found.';

    const userPrompt = `
Company: ${signals.company}

GitHub commits (past 30 / 60 / 90 days): ${signals.github.commits30d} / ${signals.github.commits60d} / ${signals.github.commits90d}
Job postings (past 30 / 60 / 90 days): ${signals.jobs.jobs30d} / ${signals.jobs.jobs60d} / ${signals.jobs.jobs90d}

Recent news:
${newsLines}

Write exactly 3 sentences in plain English about whether this company is worth applying to right now. Focus on growth momentum, hiring activity, and market presence.
`.trim();

    try {
      const { data } = await firstValueFrom(
        this.http.post<GroqResponse>(
          this.groqUrl,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content:
                  'You are a career advisor helping job seekers evaluate companies. Respond with exactly 3 concise sentences.',
              },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 250,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return (
        data.choices?.[0]?.message?.content?.trim() ??
        'AI summary unavailable.'
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Groq API failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 'AI summary could not be generated at this time.';
    }
  }
}
