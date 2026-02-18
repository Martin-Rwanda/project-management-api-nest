import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
