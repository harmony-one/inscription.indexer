import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'inscriptions' })
export class InscriptionEvent {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  transactionHash: string;

  @ApiProperty()
  @Column()
  from: string;

  @ApiProperty()
  @Column()
  to: string;

  @ApiProperty()
  @Column({ type: 'numeric' })
  value: number;

  @ApiProperty()
  @Column({ type: 'bigint' })
  gas: number;

  @ApiProperty()
  @Column({ type: 'bigint' })
  gasPrice: number;

  @ApiProperty()
  @Column()
  chain: string;

  @ApiProperty()
  @Column({ type: 'integer' })
  blockNumber: number;

  @ApiProperty()
  @Column({ type: 'integer' })
  timestamp: number;

  @ApiProperty()
  @Column({
    type: 'json',
    nullable: false,
    default: {},
  })
  payload: object;

  @ApiProperty()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
