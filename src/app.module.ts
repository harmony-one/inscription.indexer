import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config';
import entities from './typeorm';
import { IndexerModule } from './indexer/indexer.module';
import { Web3Module } from 'nest-web3';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    /*
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule,
      ],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: `${process.env.DATABASE_URL}`,
        // host: configService.get('DB_HOST'),
        // port: +configService.get<number>('DB_PORT'),
        // username: configService.get('DB_USERNAME'),
        // password: configService.get('DB_PASSWORD'),
        // database: configService.get('DB_NAME'),
        entities: entities,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    */
    IndexerModule,
    PrometheusModule.register()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
