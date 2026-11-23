import { AuthenticationError, hasMfa, OidcAuthenticator, type OidcConfig, type VerifiedOidcPrincipal } from "./oidc";

export type VerifiedActor = Readonly<{ tenantId: string; userId: string; tokenId?: string }>;
export type MembershipIdentity = Readonly<{
  userId: string;
  tenantId: string;
  tenantKind: "individual" | "institution";
  roles: readonly string[];
  membershipStatus: "active";
}>;

/** Structural subset of the shared transaction runner; no dependency on platform internals. */
export interface IamIdentityLookupRunner {
  runIdentityLookup<T>(
    identity: Readonly<{ issuer: string; subject: string; tenantId: string }>,
    work: (tx: IamIdentityLookupTransaction) => Promise<T>,
  ): Promise<T>;
}

export interface IamIdentityLookupTransaction {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[],
  ): Promise<Readonly<{ rows: readonly Row[]; rowCount: number | null }>>;
}

export class TenantMembershipService {
  constructor(
    private readonly oidc: OidcAuthenticator,
    private readonly runner: IamIdentityLookupRunner,
    private readonly config: Pick<OidcConfig, "requiredMfaAcr"> = {},
  ) {}

  async authenticate(authorization: string | undefined): Promise<VerifiedActor> {
    const principal = await this.oidc.authenticateBearer(authorization);
    const membership = await this.resolveMembership(principal);
    const privileged = membership.tenantKind === "institution" ||
      membership.roles.some((role) => ["tenant_admin", "coordinator", "auditor"].includes(role));
    if (privileged && !hasMfa(principal, this.config.requiredMfaAcr)) {
      throw new AuthenticationError("MFA is required for institutional and privileged memberships");
    }
    return Object.freeze({ tenantId: membership.tenantId, userId: membership.userId, ...(principal.tokenId ? { tokenId: principal.tokenId } : {}) });
  }

  async resolveMembership(principal: VerifiedOidcPrincipal): Promise<MembershipIdentity> {
    return this.runner.runIdentityLookup(
      { issuer: principal.issuer, subject: principal.subject, tenantId: principal.tenantId },
      async (tx) => {
        const { rows } = await tx.query<MembershipIdentity>(
          `SELECT u.id AS "userId", t.id AS "tenantId", t.kind AS "tenantKind",
                  array_agg(DISTINCT r.code ORDER BY r.code) AS roles, 'active'::text AS "membershipStatus"
             FROM iam.user AS u
             JOIN iam.membership AS m ON m.user_id = u.id
             JOIN iam.tenant AS t ON t.id = m.tenant_id
             JOIN iam.role AS r ON r.id = m.role_id
            WHERE u.idp_issuer = $1 AND u.idp_subject = $2
              AND u.status = 'active'
              AND t.id = $3 AND t.status = 'active'
              AND m.status = 'active'
              AND (m.valid_from IS NULL OR m.valid_from <= now())
              AND (m.valid_to IS NULL OR m.valid_to > now())
            GROUP BY u.id, t.id, t.kind`,
          [principal.issuer, principal.subject, principal.tenantId],
        );
        if (rows.length !== 1) throw new AuthenticationError("No active membership for the verified tenant");
        const membership = rows[0];
        if (membership.tenantId !== principal.tenantId || membership.membershipStatus !== "active") {
          throw new AuthenticationError("No active membership for the verified tenant");
        }
        return membership;
      },
    );
  }
}
