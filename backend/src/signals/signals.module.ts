import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { JobsModule } from '../jobs/jobs.module';
import { NewsModule } from '../news/news.module';
import { AiModule } from '../ai/ai.module';
import { SignalsService } from './signals.service';

@Module({
  imports: [GithubModule, JobsModule, NewsModule, AiModule],
  providers: [SignalsService],
  exports: [SignalsService],
})
export class SignalsModule {}
