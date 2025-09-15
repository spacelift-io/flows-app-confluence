export interface ConfluenceConfig {
  confluenceUrl: string;
  email: string;
  apiToken: string;
}

export class ConfluenceClient {
  private baseUrl: string;
  private auth: string;

  constructor(config: ConfluenceConfig) {
    this.baseUrl = config.confluenceUrl.replace(/\/$/, ""); // Remove trailing slash
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64",
    );
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/wiki/api/v2${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Confluence API error (${response.status}): ${errorText}`,
      );
    }

    // Handle empty responses (e.g., 204 No Content)
    const contentLength = response.headers.get("content-length");
    if (contentLength === "0" || response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: "DELETE" });
  }
}

export function createConfluenceClient(
  config: ConfluenceConfig,
): ConfluenceClient {
  return new ConfluenceClient(config);
}
