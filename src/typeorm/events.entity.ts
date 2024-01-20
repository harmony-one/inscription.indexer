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
  address: string;

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
    type: 'simple-json',
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
