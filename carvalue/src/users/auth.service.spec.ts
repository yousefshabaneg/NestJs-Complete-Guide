import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    //Create a fake copy of users service.
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Date.now(),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
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

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('yousef@gmail.com', '12345678');

    expect(user.password).not.toEqual('12345678');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    const usedEmail = 'usedEmail@gmail.com';
    await service.signup(usedEmail, 'asdf');

    await expect(service.signup(usedEmail, 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if correct email and password are provided', async () => {
    await service.signup('test@test.com', 'mypassword');

    const user = await service.signin('test@test.com', 'mypassword');
    expect(user).toBeDefined();
  });

  it('throws an error if an invalid password is provided', async () => {
    await service.signup('test@test.com', 'mypassword');

    await expect(
      service.signin('test@test.com', 'wrong password'),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws if sign in is called with an unused email', async () => {
    await expect(service.signin('test@test.com', '12345678')).rejects.toThrow(
      BadRequestException,
    );
  });
});
