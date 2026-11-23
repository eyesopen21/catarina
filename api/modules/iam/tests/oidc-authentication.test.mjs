import assert from "node:assert/strict";
import { createServer } from "node:http";
import Module from "node:module";
import { after, before, test } from "node:test";
import path from "node:path";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const syntheticTenant = "00000000-0000-4000-8000-000000000101";
const syntheticUser = "00000000-0000-4000-8000-000000000201";
let issuer;
let privateKey;
let otherPrivateKey;
let server;
let service;
let oidc;
let runner;
let AuthenticationError;
let OidcAuthenticator;
let TenantMembershipService;
let capturedLookup;
let memberships = [{ userId: syntheticUser, tenantId: syntheticTenant, tenantKind: "individual", roles: ["teacher"], membershipStatus: "active" }];

async function token(claims = {}, key = privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const { aud = "catarina-api", exp = now + 60, iss = issuer, ...payloadClaims } = claims;
  return new SignJWT({ tenant_id: syntheticTenant, amr: ["pwd"], ...payloadClaims })
    .setProtectedHeader({ alg: "RS256", kid: "dev-key" })
    .setIssuer(iss)
    .setSubject("synthetic-teacher-001")
    .setAudience(aud)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti("synthetic-token-001")
    .sign(key);
}

before(async () => {
  process.env.NODE_PATH = path.resolve("api/node_modules");
  Module._initPaths();
  ({ AuthenticationError, OidcAuthenticator, TenantMembershipService } = await import("../../../../dist/api/modules/iam/index.js"));
  const signingPair = await generateKeyPair("RS256");
  privateKey = signingPair.privateKey;
  ({ privateKey: otherPrivateKey } = await generateKeyPair("RS256"));
  // The mock IdP's signing public key is published from this local JWKS endpoint.
  const jwk = await exportJWK(signingPair.publicKey);
  Object.assign(jwk, { kid: "dev-key", use: "sig", alg: "RS256" });
  server = createServer((request, response) => {
    if (request.url === "/jwks") {
      response.writeHead(200, { "content-type": "application/json", "cache-control": "public, max-age=60" });
      response.end(JSON.stringify({ keys: [jwk] }));
    } else {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  issuer = `http://127.0.0.1:${address.port}`;
  oidc = new OidcAuthenticator({ issuer, audience: "catarina-api", jwksUri: `${issuer}/jwks` });
  runner = {
    async runIdentityLookup(identity, work) {
      capturedLookup = identity;
      return work({
        async query(sql, values) {
          assert.match(sql, /u\.idp_issuer = \$1 AND u\.idp_subject = \$2/);
          assert.match(sql, /t\.id = \$3/);
          assert.match(sql, /m\.status = 'active'/);
          assert.match(sql, /m\.valid_from/);
          assert.match(sql, /m\.valid_to/);
          assert.deepEqual(values, [identity.issuer, identity.subject, identity.tenantId]);
          return { rows: memberships, rowCount: memberships.length };
        },
      });
    },
  };
  service = new TenantMembershipService(oidc, runner);
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test("OIDC verifies signature, issuer, audience, and expiration before trusting tenant claims", async () => {
  const auth = `Bearer ${await token({ tenant_id: syntheticTenant.toUpperCase() })}`;
  const actor = await service.authenticate(auth);
  assert.deepEqual(actor, {
    tenantId: syntheticTenant,
    userId: syntheticUser,
    tokenId: "synthetic-token-001",
  });
  assert.equal(capturedLookup.issuer, issuer);
  assert.equal(capturedLookup.subject, "synthetic-teacher-001");
  assert.equal(capturedLookup.tenantId, syntheticTenant);

  await assert.rejects(service.authenticate(undefined), AuthenticationError);
  await assert.rejects(service.authenticate(`Bearer ${await token({}, otherPrivateKey)}`), AuthenticationError);
  await assert.rejects(service.authenticate(`Bearer ${await token({ aud: "wrong-api" })}`), AuthenticationError);
  await assert.rejects(service.authenticate(`Bearer ${await token({ iss: "http://wrong-issuer.invalid" })}`), AuthenticationError);
  await assert.rejects(service.authenticate(`Bearer ${await token({ exp: 1 })}`), AuthenticationError);
});

test("membership is resolved only for the verified tenant and active membership", async () => {
  memberships = [];
  const unjoinedTenant = "00000000-0000-4000-8000-000000000999";
  await assert.rejects(service.authenticate(`Bearer ${await token({ tenant_id: unjoinedTenant })}`), AuthenticationError);
  assert.equal(capturedLookup.tenantId, unjoinedTenant);

  memberships = [{ ...memberships[0], tenantId: "another-tenant" }];
  await assert.rejects(service.authenticate(`Bearer ${await token()}`), AuthenticationError);
  memberships = [{ userId: syntheticUser, tenantId: syntheticTenant, tenantKind: "individual", roles: ["teacher"], membershipStatus: "active" }];
});

test("institutional and privileged memberships require verified MFA", async () => {
  memberships = [{ userId: syntheticUser, tenantId: syntheticTenant, tenantKind: "institution", roles: ["teacher"], membershipStatus: "active" }];
  await assert.rejects(service.authenticate(`Bearer ${await token()}`), /MFA is required/);
  await assert.rejects(service.authenticate(`Bearer ${await token({ amr: ["pwd", "pin"] })}`), /MFA is required/);
  assert.deepEqual(await service.authenticate(`Bearer ${await token({ amr: ["pwd", "mfa"] })}`), {
    tenantId: syntheticTenant,
    userId: syntheticUser,
    tokenId: "synthetic-token-001",
  });
  const acrService = new TenantMembershipService(oidc, runner, { requiredMfaAcr: "urn:catarina:loa:mfa" });
  assert.deepEqual(await acrService.authenticate(`Bearer ${await token({ acr: "urn:catarina:loa:mfa" })}`), {
    tenantId: syntheticTenant,
    userId: syntheticUser,
    tokenId: "synthetic-token-001",
  });
  memberships = [{ userId: syntheticUser, tenantId: syntheticTenant, tenantKind: "individual", roles: ["tenant_admin"], membershipStatus: "active" }];
  await assert.rejects(service.authenticate(`Bearer ${await token()}`), /MFA is required/);
  memberships = [{ userId: syntheticUser, tenantId: syntheticTenant, tenantKind: "individual", roles: ["teacher"], membershipStatus: "active" }];
});
