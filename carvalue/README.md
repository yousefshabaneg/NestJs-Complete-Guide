# `Section-7: Car Value Project`

# Project Structure

![Structure](pics/structure-1.png)
![Structure](pics/structure-2.png)
![Structure](pics/structure-3.png)

# `Section-8: Persisting Data with TypeORM in Nest`

![TypeORM](pics/typeorm-1.png)

## How to create an entity ?

![create an entity](pics/typeorm-2.png)

```ts
//1) create user.entity.ts

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;
}
```

```ts
//2) update users.module.ts
+ import { TypeOrmModule } from '@nestjs/typeorm';
+ import { User } from './user.entity';
@Module({
  + imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
```

```ts
//3) update parent: app.module.ts
+ import { User } from './users/user.entity';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
    + entities: [User],
      synchronize: true,
    }),
    UsersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
``
```

## `TypeOrm: Repository Api`

> More about: [Repository Api](https://typeorm.io/repository-api)

![TypeOrm](pics/typeorm-3.png)
