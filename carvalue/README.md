### Table of Contents

| No. | Section                                                                                   |
| --- | ----------------------------------------------------------------------------------------- |
| 7   | [Car Value Project](#section-7-car-value-project)                                         |
| 8-9 | [Persisting Data with TypeORM in Nest](#section-8-9-persisting-data-with-typeorm-in-nest) |
| 10  | [Custom Data Serialization](#section-10---custom-data-serialization)                      |
| 11  | [Authentication From Scratch](#section-11-authentication-from-scratch)                    |
| 12  | [Unit Testing](#section-12-unit-testing)                                                  |
| 13  | [Integration Testing](#section-13-integration-testing)                                    |
| 14  | [Managing App Configuration](#section-14-managing-app-configuration)                      |
| 15  | [Relations with TypeORM](#section-15-relations-with-typeorm)                              |
| 16  | [A Basic Permissions System](#section-16-a-basic-permissions-system)                      |
| 17  | [Query Builders with TypeORM](#section-17-query-builders-with-typeorm)                    |
| 18  | [Production Deployment](#Section-18-production-deployment)                                |

---

# `Section-7: Car Value Project`

## Project Structure

![Structure](pics/structure-1.png)
![Structure](pics/structure-2.png)
![Structure](pics/structure-3.png)

# `Section-8-9: Persisting Data with TypeORM in Nest`

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

## `How to call the repository api and dependency injection in our service ?`

![Use Repository](pics/repo-1.png)

```ts
//1) Update users.service.ts

+ import { Repository } from 'typeorm';
+ import { InjectRepository } from '@nestjs/typeorm';
+ import { User } from './user.entity';

@Injectable()
export class UsersService {
  + constructor(@InjectRepository(User) private repo: Repository<User>) {}
  //this @InjectRepository(User) for purpose of dependency injection with generics.

  create(email: string, password: string) {
    const user = this.repo.create({ email, password });
    return this.repo.save(user);
  }
}

//2) Update users.controller.ts

+ import { UsersService } from './users.service';

@Controller('auth')
export class UsersController {
  + constructor(private usersService: UsersService) {}
  @Post('/signup')
  createUser(@Body() body: CreateUserDto) {
    + this.usersService.create(body.email, body.password);
  }
}

```

> No hooks works in save api.

![Save and Create](pics/repo-2.png)

# `Section 10 - Custom Data Serialization`

### How to hide data in Nest

#### 1- Nest Recommended Solution

1. In 'user.entity.ts'

```ts
+ import { Exclude } from 'class-transformer';
```

```ts
  // Add Exclude Decorator to the field that it must be hidden.
  + @Exclude()
  @Column()
  password: string;
```

2. In 'user.controller.ts'

```ts
import { UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
```

```ts
// Add this decorator in your route.
+ @UseInterceptors(ClassSerializerInterceptor)
  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

```

#### 2- More Complicated (much more flexible) Solution.

> [What's the difference between Interceptor vs Middleware vs Filter in Nest.js?](https://stackoverflow.com/questions/54863655/whats-the-difference-between-interceptor-vs-middleware-vs-filter-in-nest-js)

![Interceptor](pics/interceptor-1.png)
![Interceptor](pics/interceptor-2.png)

##### Our First Interceptor

> create new interceptor 'serialize.interceptor.ts'

```ts
import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';

export class SerializeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    handler: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return handler.handle().pipe(
      map((data: any) => {
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
```

> create new decorator to make use of our interceptor

```ts
export function Serialize(dto: any) {
  return UseInterceptors(new SerializeInterceptor(dto));
}
```

> Use it in our route or, or in our controller

```ts
@Serialize(UserDto)
@Get('/:id')
findUser(){}
```

### `How to make decorator accepts a class only ? (type safety)`

> to avoid this @Serialize('Hello World')
>
> > Use interface for class definition

```ts
interface ClassConstructor {
  new (...args: any[]): {};
}
function Serialize(dto: ClassConstructor){...}
```

# `Section-11: Authentication From Scratch`

### Create new Service 'Auth Service' to split out the authentication process from user service.

#### This is the module after adding Auth Service.

![Auth](pics/auth-1.png)

> Create a new service class and inject it to the module 'auth.service.ts'
>
> > Then it will be able to use UserService as a di.

```ts
// auth.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
}
```

```ts
// users.module.ts
@Module({
  + providers: [UsersService, AuthService],
})
export class UsersModule {}
```

### Signup flow : Hashing password with Salt.

![Auth](pics/auth-2.png)

> Signup functionality in the auth service class.

```ts
export class AuthService {
  async signup(email: string, password: string) {
    // Check if user email in use
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException('This email is already use.');
    }

    // Hash the user password
    // First: Generate the Salt
    const salt = randomBytes(8).toString('hex');

    // Hash the salt and the password together using scrypt function as a buffer.
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Join the hashed result and the salt together.
    // you will split it in the sign in function to get the salt and hash.
    // then with the login password you will hash it again with the given salt.
    // then compare them if they equal = Authenticated user.
    const result = `${salt}.${hash.toString('hex')}`;

    // Create a new user and save it
    const user = await this.usersService.create(email, result);

    // return created user.
    return user;
  }

  async signin(email: string, password: string) {
    // Check if user email exist.
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new BadRequestException('This email not exist.');
    }

    // Check if password is correct.
    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('Wrong Password.');
    }

    return user;
  }
}
```

## Common Auth System Features.

![Auth](pics/auth-3.png)

### How to create your own custom Param Decorator

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    return 'Current User Custom Decorator';
  },
);
```

### Now, to make a Decorator to use to get current user, we need two things

1. Session object to get the current userId, easy with context object.
1. UserService class to get access to repo, hard because the dependency injection system.

![Decorator](pics/dec-1.png)

### `Solution for this problem: Create an Interceptor to hold those things, and make it inside di container and then decorator can use it.`

![Decorator](pics/dec-2.png)

## How to connect our create-user interceptor to controllers

### 1- Controller Scoped.

> ### Hint, Very tedious if we will use this interceptor in more than one controller.

![Custom Interceptor](pics/custom-1.png)

## Steps:

> 1- Create Interceptor to add the current user to the request.

```ts
import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private userService: UsersService) {}
  async intercept(
    context: ExecutionContext,
    handler: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.session;

    if (userId) {
      const user = await this.userService.findOne(+userId);
      request.currentUser = user;
    }

    return handler.handle();
  }
}
```

> 2- Inject the interceptor to the providers of 'users.module.ts'

```ts
//users.module.ts
@Module({
  ...,
  providers: [..., CurrentUserInterceptor],
});
```

> 3- Use the interceptor in our controller.

```ts
//users.controller.ts
@UseInterceptors(CurrentUserInterceptor)
export class UsersController {}
```

### 2- Globally Scoped.

> ### Only single instance to all controllers.

![Custom Interceptor](pics/custom-2.png)

#### How to apply it globally?

```ts
// in users.module.ts

+ import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  ...,
  providers: [
    ...,
    {
      provide: APP_INTERCEPTOR,
      useClass: CurrentUserInterceptor,
    },
  ],
})
export class UsersModule {}
```

---

## How to make a `Guard`: to reject requests to certain handlers if the user is not signed in.

![Guard](pics/guard-1.png)

### As well as interceptors: we can apply guard in different locations:

1. Globally for all controllers.
1. Controller scope.
1. Single Handler Scope.

![Guard](pics/guard-2.png)

### Steps to make our AuthGuard.

> 1- Make your guard dir, and create 'auth.guard.ts'

```ts
import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.session;

    if (!userId) {
      throw new UnauthorizedException(
        'Your are not authorized for this resource.',
      );
    }

    return userId;
  }
}
```

> 2- In our controller:

```ts
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
// @UseGuards(AuthGuard) // apply guard for controller
export class UsersController {
  @Get('/whoami')
  @UseGuards(AuthGuard) // apply guard for single handler
  whoAmI(@CurrentUser() user: User) {
    return user;
  }
}
```

---

# `Section-12: Unit Testing`

![Unit Testing](pics/test-1.png)

## To make test of our 'Auth Service' functionality (signup, signin) we should have:

1. A Copy of UsersService to use [find(), create()].
1. The UsersService depends on 'UsersRepo', So it should have copy of it.
1. The UsersRepo depends on 'SQLITE' and its configuration.

![Unit Testing](pics/test-2.png)

## To make our test more straightforward we will use a trick

### We're going to use the `dependency injection` system to avoid having to create all these different dependencies.

### `Create your own fake 'UsersService'`

![Unit Testing](pics/test-3.png)
![Unit Testing](pics/test-4.png)
![Unit Testing](pics/test-5.png)

```ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

it('can create an instance of auth service', async () => {
  //Create a fake copy of users service.
  const fakeUsersService: Partial<UsersService> = {
    find: () => Promise.resolve([]),
    create: (email: string, password: string) =>
      Promise.resolve({ id: 1, email, password } as User),
  };
  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      {
        provide: UsersService,
        useValue: fakeUsersService,
      },
    ],
  }).compile();

  const service = module.get(AuthService);

  expect(service).toBeDefined();
});
```

![Unit Testing](pics/test-6.png)
![Unit Testing](pics/test-7.png)

---

# `Section-13: Integration Testing`

![Integration Testing](pics/integration-1.png)
![Integration Testing](pics/integration-2.png)

### To solve the problem of : 'Test module cannot use session or pipe because these are created in main.ts file not in the app module... We can do this: '

> ## First the ValidationPipe.

1. ### Remove uses in the main.ts file

```ts
// Remove this block of code in bootstrap function >> main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

2. ### Add new provider in AppModule file.

```ts
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

providers: [
    ...,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
  ],
```

> ## Second, Globally Scoped Middleware: 'Cookie-Session'.

1. ### Remove uses in the main.ts file

```ts
// Remove this block of code in bootstrap function >> main.ts
app.use(
  cookieSession({
    keys: ['secret-key'],
  }),
);
```

2. ### Create new method in AppModule Class.

```ts
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieSession({ keys: ['secret-key'] })).forRoutes('*');
  }
}
```

### `Create two versions of our DB , one for development and another one for testing.`

![Testing Database](pics/db-1.png)
![Testing Database](pics/db-2.png)

> #### You can solve this by using NODE_ENV variable to identify which environment you work on.

```ts
    TypeOrmModule.forRoot({
      type: 'sqlite',
    + database: process.env.NODE_ENV === 'test' ?
      'test.sqlite' : 'db.sqlite',
      ...
    }),
```

## Recommended Solution: Environment Config.

![App Config](pics/db-3.png)

### Go to next Section to read more

---

# `Section-14: Managing App Configuration`

### 1- Install @nestjs/config npm package

```bash
$ npm install @nestjs/config
```

![App Config](pics/env-1.png)
![App Config](pics/env-2.png)

Stephen Grider Says:

> ## Let me tell you what you and I are going to do. We're going to kind of forget the rules set up by the Dotenv docs people, we're not going to very strictly follow their rules. Instead, we're going to take the Nest recommendation. We are going to have more than one different file. We're going to have one specifically to be used during development of our application and one during testing of our application. So these different files are going to provide some different database names for this database property right here. We'll have one file. It says use a database name of DB_SQLITE. And then the other file will say use a database name of something like Test.SQLite or something like that. So, again, we are not strictly following the recommendations of env dOCS because I don't know, I'm just not really a big fan of that library myself, as you can tell, with all this invariant configuration stuff.

## Create two files:

1. ### .env.development
1. ### .env.test

### Then make your database configuration based on environment

```ts

import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Global your config variables.
    // choose which file compiler use based on NODE_ENV variable.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),

    // Add ConfigService to dependency container of typeorm module.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'sqlite',
          database: config.get<string>('DB_NAME'),
          entities: [User, Report],
          synchronize: true,
        };
      },
    }),
    // Comment out this part.
    // TypeOrmModule.forRoot({
    //   type: 'sqlite',
    //   database: process.env.NODE_ENV === 'test' ? 'test.sqlite' : 'db.sqlite',
    //   entities: [User, Report],
    //   synchronize: true,
    // }),
    ...,
  ],
  ...
})

```

# `Section-15: Relations with TypeORM`

## Requires Knowledge for Associations:

![Relations](pics/relations-1.png)
![Relations](pics/relations-2.png)

## Steps to create an association in nestjs and typeorm:

![Relations](pics/relations-3.png)

## Types of Relationships:

## One-to-One Relationship:

### It???s a relationship where a record in one entity (table) is associated with exactly one record in another entity (table).

- Country - capital city: Each country has exactly one capital city. Each capital city is the capital of exactly one country.

![Relations](pics/types-1.png)

## One-to-many / Many-to-one Relationship:

### This kind of relationship means that one row in a table (usually called the parent table) can have a relationship with many rows in another table (usually called child table).

- One customer may make several purchases, but each purchase is made by a single customer.

![Relations](pics/types-2.png)

## Many-to-Many Relationship:

### By definition, a many-to-many relationship is where more than one record in a table is related to more than one record in another table.

- A typical example of a many-to many relationship is one between students and classes. A student can register for many classes, and a class can include many students.

![Relations](pics/types-3.png)

---

## Our App: Relationship between Reports and users:

### One to many relationship.

![Relations](pics/reports-1.png)

### OneToMany and ManyToOne Decorators.

![Relations](pics/reports-2.png)

```ts
// in user.entity.ts
// Doesn't make a change in our Database

class User {
  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];
}
```

```ts
// in report.entity.ts
// Create user_id column in reports table in Database.

class Report {
  @ManyToOne(() => User, (user) => user.reports)
  user: User;
}
```

```ts
// in reports.service.ts

export class ReportsService {
  create(reportDto: CreateReportDto, user: User) {
    const report = this.repo.create(reportDto);
    report.user = user; // assign user to the report
    return this.repo.save(report);
  }
}
```

```ts
// in reports.controller.ts

@Controller('reports')
export class ReportsController {
  @Post()
  @UseGuards(AuthGuard)
  @Serialize(ReportDto)
  // to hide some information of user.: Serialize it --> hide password property
  createReport(@Body() body: CreateReportDto, @CurrentUser() user: User) {
    return this.reportsService.create(body, user);
  }
}
```

> ManyToOne: Create user_id column in reports table in Database.

![Relations](pics/reports-3.png)

### **Important** you should read these articles:

- [I cannot understand the syntax of callback passed to the TypeORM Relations decorator](https://stackoverflow.com/questions/66409746/i-cannot-understand-the-syntax-of-callback-passed-to-the-typeorm-relations-decor)
- [Circular Dependency TS Issue](https://github.com/Microsoft/TypeScript/issues/20361)
- [Circular Type References in TypeScript](https://stackoverflow.com/questions/24444436/circular-type-references-in-typescript)

# `Section-16: A Basic Permissions System`

## What is the difference between Authentication and Authorization?

![Role-1](pics/admin-1.png)

## Now we will build the **`Authorization`** in our App.

### Very similar to our AuthGuard that we build here: [AuthGuard Implementation](#steps-to-make-our-authguard)

![Role-1](pics/admin-2.png)

### Creation of AdminGuard.

```ts
import { CanActivate, ExecutionContext } from '@nestjs/common';

export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.currentUser) {
      return false;
    }

    return request.currentUser.admin;
  }
}
```

### Steps to make our AdminGuard.

> 1- Create 'admin.guard.ts' in src/guards directory.

```ts
import { CanActivate, ExecutionContext } from '@nestjs/common';

export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.currentUser || !request.currentUser.admin) {
      throw new UnauthorizedException(
        'Your are Unauthorized for this resource.',
      );
    }

    return true;
  }
}
```

> 2- In our reports controller:

```ts
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';

export class ReportsController {
  @Patch('/:id')
  @UseGuards(AdminGuard)
  approveReport(@Param('id') id: string, @Body() body: ApproveReportDto) {
    return this.reportsService.changeApproval(+id, body.approved);
  }
}
```

## Why this AdminGuard does not working ?

### The issue is : The Guards execute before the interceptors, and we get our currentUser from the interceptor.

### `The request Life Cycle`:

![Role-1](pics/admin-3.png)

### note: The interceptor can be executed before or after the Request Handler.

![Role-1](pics/admin-4.png)

## **Solution: We need to take our CurrentUserInterceptor and turn it into a `middleware` instead to be executed before the guards.**

![Role-1](pics/admin-5.png)

## So, now we will create the CurrentUserMiddleware instead of CurrentUserInterceptor

> 1- Create 'current-user.middleware.ts' file inside users/middlewares directory

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../users.service';

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.session || {};

    if (userId) {
      const user = await this.usersService.findOne(+userId);

      // @ts-ignore
      // this is cause an error: we will solve it later...
      req.currentUser = user;
    }

    next();
  }
}
```

> 2- In users module class:

### first remove all stuff related to CurrentUserInterceptor

```ts
// remove all this lines::
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  // remove this dependency
  {
  provide: APP_INTERCEPTOR,
  useClass: CurrentUserInterceptor,
  }
});
```

### Now, Apply our middleware in configure method

```ts
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { CurrentUserMiddleware } from './middlewares/current-user.middleware';

export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*');
  }
}
```

### Now we still have a problem in our Middleware class: 'req.currentUser':

> Property 'currentUser' does not exist on type 'Request'.

### Solution: by applying this code, now we add a new property to Request Interface of Express namespace.

```ts
declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}
```

# `Section-17: Query Builders with TypeORM`

```ts
// get-estimate.dto.ts
// Create this dto to validate the query string and transform it to the needed datatype.

import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetEstimateDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1930)
  @Max(2050)
  year: number;

  @Transform(({ value }) => parseFloat(value))
  @IsLongitude()
  lng: number;

  @Transform(({ value }) => parseFloat(value))
  @IsLatitude()
  lat: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  mileage: number;
}
```

```ts
// reports.service.ts
// filter reports and get average of the top 3 results.

  createEstimate({ make, model, lng, lat, year, mileage }: GetEstimateDto) {
    return this.repo
      .createQueryBuilder()
      .select('AVG(price)', 'price')
      .where('approved IS TRUE')
      .andWhere('make = :make', { make })
      .andWhere('model = :model', { model })
      .andWhere('lng - :lng BETWEEN -5 AND  5', { lng })
      .andWhere('lat - :lat BETWEEN -5 AND  5', { lat })
      .andWhere('year - :year BETWEEN -3 AND  3', { year })
      .orderBy('ABS(mileage - :mileage)', 'DESC')
      .setParameters({ mileage })
      .limit(3)
      .getRawOne();
  }
```

```ts
// reports.controller.ts

@Get()
  getEstimate(@Query() query: GetEstimateDto) {
    return this.reportsService.createEstimate(query);
  }
```

# `Section-18: Production Deployment`

![Production](pics/prod-1.png)

## To use our config variables in AppModule class:

### HUM, You are right, we will use our dependency injection container.

```ts
export class AppModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cookieSession({ keys: [this.configService.get('COOKIE_KEY')] }))
      .forRoutes('*');
  }
}
```

## Understanding the Synchronize Flag in TypeORM.

### Synchronize makes the entity `sync` with the database every time you run your application. Hence, whenever you add columns to an entity, create a new table by creating a new entity, or remove columns from an existing table by modifying an entity `(made a migrations)` it will automatically update the database once the server is started.

![Synchronize](pics/prod-2.png)

## Dangers of Synchronize.

### Even Though synchronization is a good option to synchronize your entity with the database, it is unsafe for production databases. Therefore migrations can be an alternative solution for safer migrations in production databases.

## Stephen Grider Says about synchronize:

> ### What kind of problem could ever possibly arise?
>
> Well, I want you to imagine a scenario where maybe you are making some changes to your code and maybe by mistake you delete some property off your user entity.
>
> Let's imagine that you then saved your entire project and deployed it off to a production environment. When your application starts up on that production server, it's going to connect to your production database type forums, then going to see your updated user entity. And it's going to notice that it no longer has a password property.
>
> So typeorm is going to automatically go into your production database and delete that entire password column. When that delete occurs, you have now lost data inside of your application. That is obviously really, really bad and definitely not something we would ever want to do.
>
> So the downside to using this synchronize flag of true is that you can very easily accidentally lose data inside of your production database the next time you deploy your app. So even though it can be really handy to use during development, because we can very quickly make changes to our database just by changing our different entity files, I highly recommend that you do not make use of synchronize true as soon as you start deploying your application to a production environment.
> ![Synchronize](pics/prod-3.png)

## Theory Behind Migrations

> It is crucial to think about the structure of our database carefully. Even if we do that, the requirements that our application has to meet change. Because of the above, we rarely can avoid having to modify the structure of our database. When doing that, we need to be careful not to lose any existing data.
>
> With database migrations, we can define a set of controlled changes that aim to modify the structure of the data. They can include adding or removing tables, changing columns, or changing the data types, for example. While we could manually run SQL queries that make the necessary adjustments, this is not the optimal approach. Instead, we want our migrations to be easy to repeat across different application environments.
>
> Also, we need to acknowledge that modifying the structure of the database is a delicate process where things can go wrong and damage the existing data. Fortunately, writing database migrations includes committing them to the repository. Therefore, they can undergo a rigorous review before merging to the master branch. In this article, we go through the idea of migrations and learn how to perform them with TypeORM.

## Read More

- [Database migrations with TypeORM](https://wanago.io/2022/07/25/api-nestjs-database-migrations-typeorm/)
- [Migrations Over Synchronize in TypeORM](https://medium.com/swlh/migrations-over-synchronize-in-typeorm-2c66bc008e74)

![Synchronize](pics/migration-1.png)
![Synchronize](pics/migration-2.png)

## Creating and Running Migrations During Development.

![Synchronize](pics/migration-3.png)
![Synchronize](pics/migration-4.png)
![Synchronize](pics/migration-5.png)

### Read [TypeORM Config Docs](https://typeorm.biunav.com/en/using-ormconfig.html#using-ormconfig-json)

## Prepare our app for migrations:

> 1- Create in root directory a new folder 'db' and create in it a new file 'data-source.ts'

```ts
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: 'test.sqlite',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
```

> 2- in our 'app.module.ts' lets use our dataSourceOptions.

```ts
import { dataSourceOptions } from '../db/data-source';

// Remove all stuff related to TypeOrmModule and put this new import

@Module({
    imports: [
    ...,
    TypeOrmModule.forRoot(dataSourceOptions),
  ],
});
```

> 3- To CREATE Migration: Put these scripts in 'package.json'

```json
  "scripts": {
    "typeorm": "npm run build && npx typeorm -d dist/db/data-source.js",
    "migration:generate": "npm run typeorm -- migration:generate",
    "migration:run": "npm run typeorm -- migration:run",
    "migration:revert": "npm run typeorm -- migration:revert"
  }
```

> 4- To Create a new Migration run this command:

```bash
$ npm run migration:generate -- db/migrations/newMigration
```
