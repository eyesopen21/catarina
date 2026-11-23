import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TenantMembershipService, type VerifiedActor } from "./authentication";
import { AuthenticationError } from "./oidc";

export type IamAuthenticatedRequest = {
  headers: Readonly<Record<string, string | string[] | undefined>>;
  iamActor?: VerifiedActor;
};

/** Nest guard adapter; API wiring supplies the configured membership service. */
@Injectable()
export class OidcAuthGuard implements CanActivate {
  constructor(private readonly membershipService: TenantMembershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IamAuthenticatedRequest>();
    const header = request.headers.authorization;
    const authorization = Array.isArray(header) ? undefined : header;
    try {
      request.iamActor = await this.membershipService.authenticate(authorization);
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) throw new UnauthorizedException(error.message);
      throw error;
    }
  }
}
