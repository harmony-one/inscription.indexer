import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'indexer_state' })
export class IndexerState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: 'inscriptions_indexer', unique: true })
  indexer_name: string;

  @Column({ type: 'integer' })
  last_synced_block: number;
}
