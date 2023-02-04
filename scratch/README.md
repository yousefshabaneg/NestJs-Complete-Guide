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

![Parts of Nest](pics/parts-of-nest.png)

## Start the Nest app

```bash
npx ts-node-dev src/main.ts
```

## Naming Convention

![Naming Convention](pics/naming-conventions.png)
