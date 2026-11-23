/** IAM authentication and tenant membership boundary (WP-11). */
export { TenantMembershipService } from "./authentication";
export type { IamIdentityLookupRunner, IamIdentityLookupTransaction, MembershipIdentity, VerifiedActor } from "./authentication";
export { AuthenticationError, OidcAuthenticator, hasMfa } from "./oidc";
export type { OidcConfig, VerifiedOidcPrincipal } from "./oidc";
export { OidcAuthGuard } from "./oidc.guard";
export type { IamAuthenticatedRequest } from "./oidc.guard";
