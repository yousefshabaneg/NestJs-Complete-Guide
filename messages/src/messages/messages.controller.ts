import { Controller, Get, Post } from '@nestjs/common';

@Controller('messages')
export class MessagesController {
  @Get()
  listMessages() {
    return 'All Messages';
  }

  @Post()
  createMessage() {
    return 'Create';
  }

  @Get('/:id')
  getMessage() {
    return 'Get MEssage';
  }
}
