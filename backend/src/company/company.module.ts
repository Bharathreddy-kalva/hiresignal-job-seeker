import { Module } from '@nestjs/common';
import { SignalsModule } from '../signals/signals.module';
import { FitScoreModule } from '../fit-score/fit-score.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  imports: [SignalsModule, FitScoreModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
