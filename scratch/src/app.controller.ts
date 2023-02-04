import { Controller, Get } from "@nestjs/common";

@Controller("/app")
export class AppController {
  @Get()
  getRootRoute() {
    return "Hi there!";
  }

  @Get("/bye")
  getByeRoute() {
    return "Bye there!";
  }
}
