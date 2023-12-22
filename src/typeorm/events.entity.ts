import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Events {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  transactionHash: string;

  @Column()
  address: string;

  @Column()
  name: string;

  @Column()
  chain: string;

  @Column()
  blockNumber: string;

  @Column({ type: 'json' })
  payload: any;
}
