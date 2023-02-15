# `Section-7: Car Value Project`

# Project Structure

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
