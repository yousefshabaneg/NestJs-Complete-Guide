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

# `Section-1: Scratch`

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
npx ts-node-dev src/main.ts
```

## Naming Convention

![Naming Convention](scratch/pics/naming-conventions.png)

---

## `FAQ`

#### `Where can I find this course??`

You can find it on Udemy by following this link: [NestJS - Udemy](https://www.udemy.com/course/nestjs-the-complete-developers-guide)

---
