import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FitScoreService } from './fit-score.service';

@Module({
  imports: [HttpModule],
  providers: [FitScoreService],
  exports: [FitScoreService],
})
export class FitScoreModule {}
