# `NestJS: The Complete Developer's Guide`

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>

---

- This repository contains the entire NestJs learning journey.
- Build full featured backend APIs incredibly quickly with Nest.
- TypeORM, and Typescript. Includes testing and deployment!.
- This course is created By (**`Stephen Grider`**).

---

# `Section-2: Scratch`

## 1- Package Dependencies

| ^   | Install Package                 | Description                                                                 |
| :-- | :------------------------------ | --------------------------------------------------------------------------- |
| 1   | @nestjs/common@7.6.17           | `Contains vast majority of functions, classes, etc, that we need from NEST` |
| 2   | @nestjs/core@7.6.17             | ` `                                                                         |
| 3   | @nestjs/platform-express@7.6.17 | `Lets Nest use ExpressJs for handling http requests`                        |
| 4   | reflect-metadata@0.1.13         | `Helps make decorators work.`                                               |
| 5   | typescript@4.3.2                | `We write nest apps with typescript`                                        |

---

## 2- Typescript Compiler options

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "es2017",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 3- Create nest module and controller

![Parts of Nest](scratch/pics/parts-of-nest.png)

## Start the Nest app

```bash
$ npx ts-node-dev src/main.ts
```

## Naming Convention

![Naming Convention](scratch/pics/naming-conventions.png)

---

# `Section 3-5: NEST CLI: CRUD generator`

# 1- Create Nest Project

```bash
$ nest new <name> [options]
// <name>	The name of the new project
```

- Generate a module **`(nest g mo)`** to keep code organized and establish clear boundaries (grouping related components)
- Generate a controller **`(nest g co)`** to define CRUD routes (or queries/mutations for GraphQL applications)
- Generate a service **`(nest g s)`** to implement & isolate business logic
- Generate an entity class/interface to represent the resource data shape
- Generate Data Transfer Objects (or inputs for GraphQL applications) to define how the data will be sent over the network

# Pipes

## Validation Pipe

![validation pipe](messages/pics/validation-pipe.png)

## Automatic Validation

![automatic validation](messages/pics/automatic-validation.png)

## `Finally to use pipe to validate body data in our project, we have some small steps:`

- Tell nest to use global validation, HOW?

  ```ts
  import { ValidationPipe } from "@nestjs/common";
  app.useGlobalPipes(new ValidationPipe());
  ```

  > > in 'main.ts' file we import ValidationPipe from common. then we use it inside bootstrap function:

- Create A DTO Class inside dtos folder for required validation: Call it for example: "CreateMessageDto" and use some npm packages [class-validator](https://github.com/typestack/class-validator) and [class-transformer](https://github.com/typestack/class-transformer) to make use of decorators to validate your fields.

  ```ts
  # dtos/create-message-dto.ts
  import { IsString } from 'class-validator';
  export class CreateMessageDto {
    @IsString()
    content: string;
  }
  ```

- Inside your controller go to the post method and make the body to be a dto object .

  ```ts
  import { CreateMessageDto } from './dtos/create-message-dto';
  @Post()
    createMessage(@Body() body: CreateMessageDto) {
      console.log(body);
    }
  ```

---

# Difference between Service and Repository

![Service and Repository 1](messages/pics/service-repo-1.png)
![Service and Repository 2](messages/pics/service-repo-2.png)

- Read this

  - [NestJS with TypeORM: When using custom repository, is a service needed anymore?](https://stackoverflow.com/questions/52030009/nestjs-with-typeorm-when-using-custom-repository-is-a-service-needed-anymore)
  - [Implementing a Generic Repository Pattern Using NestJS
    ](https://betterprogramming.pub/implementing-a-generic-repository-pattern-using-nestjs-fb4db1b61cce)

---

## ` Dependency Injection in our project between (controller-service-repository)`

> Never Do this
>
> > **BAD**: Message Service creates its own copy of MessagesRepository

```ts
export class MessagesService {
  messagesRepo: MessagesRepository;
  constructor() {
    // DO NOT DO THAT in real apps: use Dependency Injection
    this.messagesRepo = new MessagesRepository();
  }
}
```

> **Lets Solve this with Dependency Injection.**

![DI](messages/pics/di-1.png)

> Instead, Do this
>
> > **Better**: MessagesService receives its dependency.

```ts
export class MessagesService {
  messagesRepo: MessagesRepository;
  constructor(repo: MessagesRepository) {
    this.messagesRepo = repo;
  }
}
```

# BEST SOLUTION: REPOSITORY PATTERN

> Read this First: [Implementing a Generic Repository Pattern Using NestJS](https://betterprogramming.pub/implementing-a-generic-repository-pattern-using-nestjs-fb4db1b61cce)

> MessagesService receives its dependency, and it doesn't specifically required 'Message Repository' you can change your datasource in a flexible way.

```ts
interface Repository {
  findOne(id: string);
  findAll();
  create(content: string);
}
export class MessagesService {
  messagesRepo: Repository;
  constructor(repo: Repository) {
    this.messagesRepo = repo;
  }
}
```

![DI](messages/pics/di-2.png)
![DI](messages/pics/di-3.png)
![DI](messages/pics/di-4.png)

## Few more notes about DI

- ` Stephen Grider says:`

> last thing I want to touch on is the fact that as you start to look at this code, you might really start to say, what is the benefit? What have we really gained here? What is the big benefit to all the stuff we've done? Who cares about using dependency injection? Well, to be honest with you, sometimes I kind of agree with you not going to lie. Sometimes in invest making use of dependency injection feels like we are just kind of jumping through extra hoops without really gaining a whole lot.

> So if you feel that way, totally fine. But I can't tell you without a doubt, is that testing your application when you're making use of dependency injection and its entire inversion of control technique, testing your app is going to be far easier, a lot easier. So eventually when we start writing tests around our application, we're going to see that testing individual classes inside of our app is going to be very simple and straightforward compared to if we were not making use of inversion of control and dependency injection. So just keep in mind that is really the payout. The payout of all this stuff is once we start writing tests. So that's kind of got a corollary to it, I'm assuming that you are interested in testing and you want to do testing.

## `FAQ`

#### `Where can I find this course??`

You can find it on Udemy by following this link: [NestJS - Udemy](https://www.udemy.com/course/nestjs-the-complete-developers-guide)

---
