export interface IGoogleAuthProvider {
    verifyIdToken(idToken: string): Promise<{ email: string; name: string } | null>;
}
