import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // Check if user email in use
    const users = await this.usersService.find(email);

    if (users.length) {
      throw new BadRequestException('This email is already use.');
    }

    // Hash the user password
    // Generate the Salt
    const salt = randomBytes(8).toString('hex');

    // Hash the salt and the password together.
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Join the hashed result and the salt together
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
