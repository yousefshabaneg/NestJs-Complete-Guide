import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';

@Injectable()
export class MessagesRepository {
  async findOne(id: string) {
    const messages = JSON.parse(await readFile('messages.json', 'utf-8'));
    const message = messages.find((m: { id: number }) => m.id === +id);
    return message;
  }
  async findAll() {
    const messages = JSON.parse(await readFile('messages.json', 'utf-8'));
    return messages;
  }
  async create(content: string) {
    const messages = JSON.parse(await readFile('messages.json', 'utf-8'));
    const id = Math.floor(Math.random() * 999);
    const obj = { id, content };
    messages.push(obj);
    await writeFile('messages.json', JSON.stringify(messages));
    return obj;
  }
}
