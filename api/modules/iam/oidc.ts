import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type VerifiedOidcPrincipal = Readonly<{
  issuer: string;
  subject: string;
  tenantId: string;
  authMethods: readonly string[];
  acr?: string;
  tokenId?: string;
}>;

export type OidcConfig = Readonly<{
  issuer: string;
  audience: string;
  jwksUri: string;
  requiredMfaAcr?: string;
}>;

export class AuthenticationError extends Error {
  readonly statusCode = 401;
  constructor(message = "Invalid bearer token", cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "AuthenticationError";
  }
}

/** Verifies OIDC access tokens against the configured issuer's published keys. */
export class OidcAuthenticator {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: OidcConfig) {
    const jwksUrl = new URL(config.jwksUri);
    if (jwksUrl.protocol !== "https:" && jwksUrl.hostname !== "localhost" && jwksUrl.hostname !== "127.0.0.1") {
      throw new Error("OIDC JWKS URI must use HTTPS except for loopback development IdPs");
    }
    this.jwks = createRemoteJWKSet(jwksUrl);
  }

  async authenticateBearer(authorization: string | undefined): Promise<VerifiedOidcPrincipal> {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? "");
    if (!match) throw new AuthenticationError("Bearer token required");

    try {
      const { payload } = await jwtVerify(match[1], this.jwks, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: ["RS256", "ES256"],
        requiredClaims: ["iss", "sub", "exp", "iat"],
      });
      return this.toPrincipal(payload);
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError("Invalid bearer token", error);
    }
  }

  private toPrincipal(payload: JWTPayload): VerifiedOidcPrincipal {
    const tenantId = payload.tenant_id;
    if (typeof payload.iss !== "string" || typeof payload.sub !== "string" ||
        typeof tenantId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
      throw new AuthenticationError("Required verified identity claims are missing");
    }
    const methods = Array.isArray(payload.amr) ? payload.amr.filter((item): item is string => typeof item === "string") : [];
    return Object.freeze({
      issuer: payload.iss,
      subject: payload.sub,
      tenantId: tenantId.toLowerCase(),
      authMethods: Object.freeze(methods),
      ...(typeof payload.acr === "string" ? { acr: payload.acr } : {}),
      ...(typeof payload.jti === "string" ? { tokenId: payload.jti } : {}),
    });
  }
}

/** MFA is required for every institution membership and privileged IAM role. */
export function hasMfa(principal: VerifiedOidcPrincipal, requiredMfaAcr?: string): boolean {
  const methods = new Set(principal.authMethods.map((method) => method.toLowerCase()));
  return methods.has("mfa") || (!!requiredMfaAcr && principal.acr === requiredMfaAcr);
}
