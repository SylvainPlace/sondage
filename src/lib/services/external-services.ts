export interface VerifiedIdentity {
  uid: string;
  emailNormalized: string;
  authenticatedAt: Date;
}

export interface IdentityProvider {
  verifyIdToken(idToken: string): Promise<VerifiedIdentity>;
  activateWithPassword(input: {
    emailNormalized: string;
    password: string;
  }): Promise<VerifiedIdentity>;
  authenticateWithPassword(input: {
    emailNormalized: string;
    password: string;
  }): Promise<VerifiedIdentity>;
  resetPassword(input: { uid: string; password: string }): Promise<void>;
}

export interface EmailMessage {
  to: string;
  template: string;
  variables: Readonly<Record<string, string>>;
  idempotencyKey: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}

export interface HumanVerificationProvider {
  verify(input: {
    token: string;
    remoteIp?: string;
    idempotencyKey: string;
  }): Promise<{ valid: boolean }>;
}

export interface ExchangeRate {
  baseCurrency: string;
  quoteCurrency: string;
  rateMillionths: number;
  observedOn: string;
  source: string;
}

export interface ExchangeRateProvider {
  getRate(input: {
    baseCurrency: string;
    quoteCurrency: string;
    observedOn: string;
  }): Promise<ExchangeRate>;
}

export interface ExternalServices {
  identity: IdentityProvider;
  email: EmailProvider;
  humanVerification: HumanVerificationProvider;
  exchangeRates: ExchangeRateProvider;
}
