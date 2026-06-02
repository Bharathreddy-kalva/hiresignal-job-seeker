import { Module } from '@nestjs/common';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { AlertService } from './alert.service';

@Module({
  imports: [WatchlistModule],
  providers: [AlertService],
})
export class AlertModule {}
