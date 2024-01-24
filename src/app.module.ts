import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config';
import entities from './typeorm';
import { IndexerModule } from './indexer/indexer.module';
import { Web3Module } from 'nest-web3';
import { typeormConfig } from './config/typeorm';
import { LotteryService } from './lottery/lottery.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig, configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
    IndexerModule,
    PrometheusModule.register(),
  ],
  controllers: [AppController],
  providers: [AppService, LotteryService],
})
export class AppModule {}
