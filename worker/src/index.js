// Cloudflare Workers entrypoint
// - Handles CORS preflight
// - Generates past life reading via OpenAI Responses API
// - Stores results in KV with a 7-day TTL

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// JSON Schema for Structured Outputs (Responses API)
const PAST_LIFE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    daily_life: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
    key_event: { type: "string" },
    carryover_traits: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
    },
    advice: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
  },
  required: ["summary", "daily_life", "key_event", "carryover_traits", "advice"],
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

function buildPrompt({ birthdate, answers }) {
  return `以下の入力をもとに、リアル寄りの前世診断テキストを作成してください。\n` +
    `- 生年月日: ${birthdate}\n` +
    `- 回答（番号）: ${answers.join(", ")}\n\n` +
    `条件:\n` +
    `- 世界史の時代感に沿った生活描写を入れる\n` +
    `- 誇張しすぎず、実在しそうな語り口にする\n` +
    `- 日本語で、落ち着いたトーンにする\n` +
    `- 出力はJSONのみ`;
}

async function callOpenAI({ apiKey, prompt }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "あなたは実務的で歴史に詳しい語り手です。指定スキーマのJSONのみを返してください。",
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "past_life_result",
          schema: PAST_LIFE_SCHEMA,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "OpenAI API error");
  }

  const data = await response.json();
  const outputText =
    data.output?.flatMap((item) => item.content || []).find((content) =>
      ["output_text", "text"].includes(content.type)
    )?.text || data.output_text;

  if (!outputText) {
    throw new Error("No output text from model");
  }

  return JSON.parse(outputText);
}

function parseRequestBody(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid JSON body");
  }
  const { birthdate, answers } = body;
  if (typeof birthdate !== "string" || birthdate.trim() === "") {
    throw new Error("birthdate is required");
  }
  if (!Array.isArray(answers) || answers.some((item) => typeof item !== "number")) {
    throw new Error("answers must be number[]");
  }
  return { birthdate, answers };
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/generate") {
      try {
        if (!env.OPENAI_API_KEY) {
          return errorResponse("OPENAI_API_KEY is not set", 500);
        }
        if (!env.RESULTS) {
          return errorResponse("RESULTS KV binding is not set", 500);
        }

        const body = await request.json();
        const { birthdate, answers } = parseRequestBody(body);

        // Build prompt and call OpenAI
        const prompt = buildPrompt({ birthdate, answers });
        const resultJson = await callOpenAI({
          apiKey: env.OPENAI_API_KEY,
          prompt,
        });

        // Store in KV (no personal data beyond generated result)
        const resultId = crypto.randomUUID();
        const stored = {
          result_id: resultId,
          result: resultJson,
          created_at: new Date().toISOString(),
        };

        await env.RESULTS.put(resultId, JSON.stringify(stored), {
          expirationTtl: TTL_SECONDS,
        });

        return jsonResponse({ result_id: resultId, result: resultJson });
      } catch (error) {
        return errorResponse("Failed to generate result", 500);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/result") {
      try {
        if (!env.RESULTS) {
          return errorResponse("RESULTS KV binding is not set", 500);
        }
        const resultId = url.searchParams.get("id");
        if (!resultId) {
          return errorResponse("Missing id", 400);
        }

        const stored = await env.RESULTS.get(resultId, { type: "json" });
        if (!stored) {
          return errorResponse("Not found", 404);
        }

        return jsonResponse(stored);
      } catch (error) {
        return errorResponse("Failed to load result", 500);
      }
    }

    return errorResponse("Not found", 404);
  },
};
