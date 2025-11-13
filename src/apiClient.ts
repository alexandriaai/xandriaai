// Ricky Morival 1.4 Section + Alexandra Sanzare 3.1 Section
// ✅ Production-Safe Version – November 2025
// Routes all traffic through your FastAPI backend only.
// No Gemini API key is ever loaded or sent from the frontend.

/* eslint-disable no-console */
import * as vscode from "vscode";
import * as https from "https";

export type RequestOptions = {
  path: string;
  method?: "GET" | "POST";
  body?: any;
  signal?: AbortSignal;
};

// ✅ Toggle this to show/hide console debug logs
const DEBUG = true;

export class ApiClient {
  constructor(private readonly context: vscode.ExtensionContext) {}

  // ✅ Determines whether we’re using Render (production) or local FastAPI (dev)
  private get config() {
    const isRender = !vscode.env.remoteName;

    const baseUrl = isRender
      ? "https://xandriaai.onrender.com" // Hosted backend (Render)
      : "http://127.0.0.1:8001";         // Local backend

    return {
      baseUrl,
      allowInsecure: !isRender,
      timeoutMs: 10000,
    };
  }

  // ✅ Generic request wrapper – all backend calls go through this
  async request<T = any>({ path, method = "GET", body, signal }: RequestOptions): Promise<T> {
    const { baseUrl, allowInsecure, timeoutMs } = this.config;

    let controller: AbortController | undefined;
    let timeout: NodeJS.Timeout | undefined;
    let finalSignal = signal;

    if (!signal) {
      controller = new AbortController();
      timeout = setTimeout(() => controller!.abort(), timeoutMs);
      finalSignal = controller.signal;
    }

    // ✅ Backend handles authentication and API key internally
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const endpoint = new URL(path, baseUrl).toString();

    try {
      if (DEBUG) {
        console.log("🚀 [XandriaAI Request Started]");
        console.log("   ➤ Endpoint:", endpoint);
        console.log("   ➤ Method:", method);
        console.log("   ➤ Body:", body ? JSON.stringify(body) : "(none)");
      }

      const res = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        mode: "cors",
        signal: finalSignal,
        // @ts-ignore
        agent: allowInsecure ? new https.Agent({ rejectUnauthorized: false }) : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text || "No response body"}`);
      }

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (DEBUG) {
        console.log("✅ [XandriaAI Response OK]");
        console.log("   ➤ Status:", res.status);
        console.log("   ➤ Type:", contentType);
        console.log("   ➤ Data:", data);
      }

      return data as T;
    } catch (err: any) {
      console.error("❌ [XandriaAI Fetch Error]");
      console.error("   ➤ Endpoint:", endpoint);
      console.error("   ➤ Method:", method);
      console.error("   ➤ Error:", err);
      vscode.window.showErrorMessage(`⚠️ Request failed: ${err.message || err}`);
      throw err;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  // ✅ Snippet generation endpoint
  async getSuggestedSnippet(payload: { language: string; codeContext: string }): Promise<{ snippet: string }> {
    return this.request<{ snippet: string }>({
      path: "/process",
      method: "POST",
      body: payload,
    });
  }

  // ✅ Static analysis endpoint
  async analyzeCode(payload: { code: string; languageId: string; fileName: string }): Promise<any> {
    return this.request<any>({
      path: "/analyze",
      method: "POST",
      body: payload,
    });
  }
}
