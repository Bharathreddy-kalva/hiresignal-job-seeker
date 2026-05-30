import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JobsService } from './jobs.service';

@Module({
  imports: [HttpModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
