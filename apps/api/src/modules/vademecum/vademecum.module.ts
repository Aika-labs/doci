import { Module } from '@nestjs/common';
import { VademecumController } from './vademecum.controller';
import { VademecumService } from './vademecum.service';

@Module({
  controllers: [VademecumController],
  providers: [VademecumService],
  exports: [VademecumService],
})
export class VademecumModule {}
