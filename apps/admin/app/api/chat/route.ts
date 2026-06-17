/**
 * Manhaj principal chat — /api/chat (POST), streaming + multi-turn.
 *
 * Request body:
 *   {
 *     messages: Array<{ role: "user" | "assistant"; content: string }>
 *   }
 *
 * The last message must be from the user. The full array (prior turns + new
 * question) is forwarded to Claude so context is preserved across questions.
 *
 * Response: Server-Sent Events stream.
 *   data: { "type": "delta",  "text": "...partial text..." }
 *   data: { "type": "done",   "meta": { input_tokens, output_tokens, ... } }
 *   data: { "type": "error",  "message": "..." }
 *
 * DEMO MODE: anonymous; no auth needed because the /admin page sits behind
 * the password gate (public/gate.js). Cost logging goes through the anon
 * RPC `manhaj_log_ai_usage` (schema/008).
 */

import { NextRequest } from "next/server";
import { anthropicClient, MANHAJ_SYSTEM_PROMPT, CHAT_MODEL } from "@manhaj/lib/anthropic";
import { serverClient } from "@manhaj/lib/supabase";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "International School of Oman";

// Limits — guards against runaway clients.
const MAX_MESSAGES   = 20;        // hard cap on conversation length sent to Claude
const MAX_USER_CHARS = 4000;      // per-message char cap
const MAX_TOTAL_CHARS = 40_000;   // aggregate cap across whole conversation

type ChatMessage = { role: "user" | "assistant"; content: string };

function sseEncode(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

export async function POST(request: NextRequest) {
  let messages: ChatMessage[] = [];
  try {
    const body = await request.json();
    const raw = body?.messages;
    if (!Array.isArray(raw)) {
      return errorResponse("Body must include `messages` as an array.", 400);
    }
    messages = (raw as Array<{ role?: unknown; content?: unknown }>)
      .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({ role: m.role as "user" | "assistant", content: (m.content as string).trim() }))
      .filter(m => m.content.length > 0);

    if (messages.length === 0) {
      return errorResponse("No valid messages in request.", 400);
    }
    if (messages.length > MAX_MESSAGES) {
      // keep the most recent turns
      messages = messages.slice(-MAX_MESSAGES);
    }
    if (messages[messages.length - 1].role !== "user") {
      return errorResponse("The last message must be from the user.", 400);
    }
    for (const m of messages) {
      if (m.content.length > MAX_USER_CHARS) {
        return errorResponse(`Message too long (${MAX_USER_CHARS} char max).`, 400);
      }
    }
    const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return errorResponse("Conversation is too long — start a new chat.", 400);
    }
  } catch {
    return errorResponse("Body must be JSON.", 400);
  }

  // Build the SSE stream. Anthropic's SDK supports streaming via
  // `client.messages.stream(...)`. We iterate the events and pipe text deltas
  // out as SSE; metadata + usage are emitted on the final `done` event.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      try {
        const client = anthropicClient();
        const apiStream = client.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: MANHAJ_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });

        for await (const event of apiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta" &&
            event.delta.text
          ) {
            controller.enqueue(sseEncode({ type: "delta", text: event.delta.text }));
          }
        }

        const final = await apiStream.finalMessage();
        const elapsedMs    = Date.now() - startedAt;
        const inputTokens  = final.usage?.input_tokens  ?? 0;
        const outputTokens = final.usage?.output_tokens ?? 0;
        const cachedRead   = final.usage?.cache_read_input_tokens ?? 0;
        const cacheHit     = cachedRead > 0;

        // Sonnet 4.5 pricing (USD per million tokens): in $3, cached read $0.30, out $15
        const nonCachedIn = inputTokens - cachedRead;
        const costUsd =
          (nonCachedIn * 3 / 1_000_000) +
          (cachedRead * 0.30 / 1_000_000) +
          (outputTokens * 15 / 1_000_000);

        // Best-effort usage log. Don't fail the response on logging failure.
        try {
          const sb = await serverClient();
          await sb.rpc("manhaj_log_ai_usage", {
            p_school_name: SCHOOL_NAME,
            p_request_kind: "principal_chat",
            p_model: CHAT_MODEL,
            p_input_tokens: inputTokens,
            p_output_tokens: outputTokens,
            p_cost_usd: Number(costUsd.toFixed(4)),
            p_cache_hit: cacheHit,
            p_is_background: false,
          });
        } catch {
          // swallow
        }

        controller.enqueue(sseEncode({
          type: "done",
          meta: {
            model: CHAT_MODEL,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cache_hit: cacheHit,
            elapsed_ms: elapsedMs,
            cost_usd: Number(costUsd.toFixed(4)),
          },
        }));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const friendly = msg.includes("ANTHROPIC_API_KEY")
          ? "Claude isn't wired up yet. Add ANTHROPIC_API_KEY to apps/admin/.env.local (dev) or Vercel env vars (prod)."
          : msg;
        try {
          controller.enqueue(sseEncode({ type: "error", message: friendly }));
        } catch { /* stream may already be closed */ }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      // Some hosting layers (Vercel edge proxies / Cloudflare) buffer SSE unless
      // we hint otherwise. The X-Accel-Buffering header is honored by nginx-like
      // intermediaries; harmless elsewhere.
      "X-Accel-Buffering": "no",
    },
  });
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
