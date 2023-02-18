import { Report } from '../reports/report.entity';
import {
  AfterInsert,
  AfterUpdate,
  AfterRemove,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  @AfterInsert()
  logInsert() {
    console.log(`Inserted user with id: ${this.id}`);
  }

  @AfterRemove()
  logRemove() {
    console.log(`Removed user with id: ${this.id}`);
  }

  @AfterUpdate()
  logUpdate() {
    console.log(`Updated user with id: ${this.id}`);
  }
}
