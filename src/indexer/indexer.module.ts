import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { ConfigModule } from '@nestjs/config';
import { IndexerController } from './indexer.controller';
import { Events } from 'src/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    // TypeOrmModule.forFeature([Events]),
  ],
  providers: [IndexerService],
  exports: [IndexerService],
  controllers: [IndexerController],
})
export class IndexerModule {}
