export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = "GitHubApiError"
  }
}

export class GitHubTokenAusenteError extends Error {
  constructor() {
    super("GITHUB_TOKEN não configurado no servidor.")
    this.name = "GitHubTokenAusenteError"
  }
}

export class GitHubTimeoutError extends Error {
  constructor() {
    super("A API do GitHub demorou demais para responder.")
    this.name = "GitHubTimeoutError"
  }
}
