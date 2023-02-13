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
