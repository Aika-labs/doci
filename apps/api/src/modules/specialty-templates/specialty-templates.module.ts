import { Module } from '@nestjs/common';
import { SpecialtyTemplatesController } from './specialty-templates.controller';
import { SpecialtyTemplatesService } from './specialty-templates.service';

@Module({
  controllers: [SpecialtyTemplatesController],
  providers: [SpecialtyTemplatesService],
  exports: [SpecialtyTemplatesService],
})
export class SpecialtyTemplatesModule {}
