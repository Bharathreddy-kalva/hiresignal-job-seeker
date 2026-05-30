import { Injectable } from '@nestjs/common';
import { SignalsService } from '../signals/signals.service';
import type { HireSignalResult } from '../common/types';

@Injectable()
export class CompanyService {
  constructor(private readonly signals: SignalsService) {}

  search(name: string): Promise<HireSignalResult> {
    return this.signals.analyze(name);
  }
}
