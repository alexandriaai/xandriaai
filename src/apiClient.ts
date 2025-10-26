// Ricky Morival 1.4 Section + Alexandra Sanzare 3.1 Section
// ✅ Final Production Version – Permanent Fix
// Auto-loads Gemini key from .env and removes manual token setup requirement
// Includes detailed debugging for fetch errors
/* eslint-disable no-console */
import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// ✅ Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST';
  body?: any;
  signal?: AbortSignal;
};

// ✅ Toggle this to enable/disable console debug logs
const DEBUG = true;

export class ApiClient {
  constructor(private readonly context: vscode.ExtensionContext) {}

  private get config() {
    const cfg = vscode.workspace.getConfiguration('xandriaai');
    return {
      baseUrl: String(cfg.get('serverBaseUrl') || 'http://127.0.0.1:8000'),
      allowInsecure: Boolean(cfg.get('allowInsecureTls') || false),
      timeoutMs: Number(cfg.get('requestTimeoutMs') || 10000),
    };
  }

  async request<T = any>({ path, method = 'GET', body, signal }: RequestOptions): Promise<T> {
    const { baseUrl, allowInsecure, timeoutMs } = this.config;

    // ✅ Load token from VS Code secrets or fallback to .env GEMINI_API_KEY
    let token = await this.context.secrets.get('xandriaai.apiToken');
    if (!token || token.trim() === '') {
      token = process.env.GEMINI_API_KEY || '';
    }

    if (!token) {
      vscode.window.showErrorMessage(
        '❌ Missing Gemini API key. Add it to your .env or set via “XandriaAI: Set API Token”.'
      );
      throw new Error('Missing Gemini API key');
    }

    let controller: AbortController | undefined;
    let timeout: NodeJS.Timeout | undefined;
    let finalSignal = signal;

    if (!signal) {
      controller = new AbortController();
      timeout = setTimeout(() => controller!.abort(), timeoutMs);
      finalSignal = controller.signal;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const endpoint = new URL(path, baseUrl).toString();

    try {
      if (DEBUG) {
        console.log('🚀 [XandriaAI Request Started]');
        console.log('   ➤ Endpoint:', endpoint);
        console.log('   ➤ Method:', method);
        console.log('   ➤ Body:', body ? JSON.stringify(body) : '(none)');
        console.log('   ➤ Token present:', !!token);
      }

      // ✅ Added "mode: 'cors'" for VS Code webview HTTPS compatibility
      const res = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        mode: 'cors', // <--- crucial addition
        signal: finalSignal,
        // @ts-ignore
        agent: allowInsecure ? new https.Agent({ rejectUnauthorized: false }) : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text || 'No response body'}`);
      }

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json()
        : await res.text();

      if (DEBUG) {
        console.log('✅ [XandriaAI Response OK]');
        console.log('   ➤ Status:', res.status);
        console.log('   ➤ Type:', contentType);
        console.log('   ➤ Data:', data);
      }

      return data as T;
    } catch (err: any) {
      // ✅ Full debug log for troubleshooting
      console.error('❌ [XandriaAI Fetch Error]');
      console.error('   ➤ Endpoint:', endpoint);
      console.error('   ➤ Method:', method);
      console.error('   ➤ Error name:', err?.name);
      console.error('   ➤ Error message:', err?.message || err);
      console.error('   ➤ Stack:', err?.stack);

      // User-facing error messages
      if (err?.name === 'AbortError') {
        vscode.window.showErrorMessage(
          '⏳ Request timed out. Increase xandriaai.requestTimeoutMs in settings or try again.'
        );
        throw new Error('Request timed out.');
      }

      vscode.window.showErrorMessage(`⚠️ Request failed: ${err.message || err}`);
      throw err;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  // ✅ AI Snippet generation endpoint (no /api prefix)
  async getSuggestedSnippet(payload: { language: string; codeContext: string }): Promise<{ snippet: string }> {
    return this.request<{ snippet: string }>({
      path: '/snippet',
      method: 'POST',
      body: payload,
    });
  }

  // ✅ AST / static analysis endpoint (no /api prefix)
  async analyzeCode(payload: { code: string; languageId: string; fileName: string }): Promise<any> {
    return this.request<any>({
      path: '/analyze',
      method: 'POST',
      body: payload,
    });
  }
}
