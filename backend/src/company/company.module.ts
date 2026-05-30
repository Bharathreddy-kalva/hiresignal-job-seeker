import { Module } from '@nestjs/common';
import { SignalsModule } from '../signals/signals.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  imports: [SignalsModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
