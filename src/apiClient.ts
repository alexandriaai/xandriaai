// Ricky Morival 1.4 Section + Alexandra Sanzare 3.1 Section

import * as vscode from 'vscode';
import * as https from 'https';

export type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST';
  body?: any;
  signal?: AbortSignal;
};

export class ApiClient {
  constructor(private readonly context: vscode.ExtensionContext) {}

  private get config() {
    const cfg = vscode.workspace.getConfiguration('xandriaai');
    return {
      baseUrl: String(cfg.get('serverBaseUrl') || 'http://127.0.0.1:8000'), // 👈 default backend
      allowInsecure: Boolean(cfg.get('allowInsecureTls') || false),
      timeoutMs: Number(cfg.get('requestTimeoutMs') || 10000),
    };
  }

  async request<T = any>({ path, method='GET', body, signal }: RequestOptions): Promise<T> {
    const { baseUrl, allowInsecure, timeoutMs } = this.config;
    const token = await this.context.secrets.get('xandriaai.apiToken');
    if (!token) throw new Error('Missing API token. Run “XandriaAI: Set API Token”.');

    let controller: AbortController | undefined;
    let timeout: NodeJS.Timeout | undefined;
    let finalSignal = signal;

    if (!signal) {
      controller = new AbortController();
      timeout = setTimeout(() => controller!.abort(), timeoutMs);
      finalSignal = controller.signal;
    }

    try {
      const res = await fetch(new URL(path, baseUrl).toString(), {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        // @ts-ignore
        agent: allowInsecure ? new https.Agent({ rejectUnauthorized: false }) : undefined,
        signal: finalSignal
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text || 'No response body'}`);
      }

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json() as T;
      return (await res.text()) as unknown as T;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Request timed out. Increase xandriaai.requestTimeoutMs or try again.');
      }
      throw err;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  // 4.2 – OpenAI snippet suggestion
  async getSuggestedSnippet(payload: { language: string; codeContext: string }): Promise<{snippet:string}> {
    return this.request<{snippet:string}>({ path: '/api/snippet', method: 'POST', body: payload });
  }

  // 3.1 – AST analysis
  async analyzeCode(payload: { code: string; languageId: string; fileName: string }): Promise<any> {
    return this.request<any>({ path: '/api/analyze', method: 'POST', body: payload });
  }
}
