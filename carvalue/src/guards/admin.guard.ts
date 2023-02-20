import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    console.log(request.currentUser);

    if (!request.currentUser || !request.currentUser.admin) {
      throw new UnauthorizedException(
        'Your are Unauthorized for this resource.',
      );
    }
    console.log(request.currentUser.admin);

    return true;
  }
}
