/** Future OIDC adapter contract. No implementation or authenticated state exists in the demo. */
export interface AuthPort {
  beginSignIn(): Promise<void>;
}
