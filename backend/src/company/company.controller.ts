import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('companies')
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get('search')
  search(@Query('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Query parameter "name" is required');
    }
    return this.company.search(name.trim());
  }
}
