import schema from "../shared/schema.json" assert { type: "json" };

const BASE_PROMPT = `あなたは実務的で落ち着いた語り口の神秘史家です。前世の描写は世界史の範囲で現実味を持たせ、生活感のある詳細を含めてください。誇張や過剰な神格化は避け、静かな詩情で整えます。出力は日本語で、指定スキーマのJSONのみを返します。`;

const AURA_STYLE = `曼荼羅、幾何学、中心対称、抽象発光、薄紫〜青、金の差し色、上品。人物や有名作品に似せない。`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

async function callOpenAI({ apiKey, payload }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "OpenAI API error");
  }

  return response.json();
}

function extractStructuredJson(response) {
  const outputText =
    response.output?.flatMap((item) => item.content || []).find((content) =>
      ["output_text", "text"].includes(content.type)
    )?.text || response.output_text;

  if (!outputText) {
    throw new Error("No output text from model");
  }

  return JSON.parse(outputText);
}

async function generateImage({ apiKey, prompt }) {
  const response = await fetch("https://api.openai.com/v1/images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Image generation error");
  }

  const data = await response.json();
  return data.data?.[0]?.b64_json;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/generate" && request.method === "POST") {
      try {
        if (!env.OPENAI_API_KEY) {
          return errorResponse("OPENAI_API_KEY is not set", 500);
        }
        if (!env.PASTLIFE_KV) {
          return errorResponse("PASTLIFE_KV is not set", 500);
        }

        const body = await request.json();
        const { birth_date, birth_time, birth_place, answers } = body;

        if (!birth_date || !Array.isArray(answers)) {
          return errorResponse("Invalid request", 400);
        }

        const userPrompt = `以下の入力をもとに前世診断を作成してください。\n\n生年月日: ${birth_date}\n出生時刻: ${birth_time || "未入力"}\n出生地: ${birth_place || "未入力"}\n\n質問回答:\n${answers
          .map((item, index) => `${index + 1}. ${item.question} -> ${item.choice}`)
          .join("\n")}`;

        const response = await callOpenAI({
          apiKey: env.OPENAI_API_KEY,
          payload: {
            model: "gpt-4.1-mini",
            input: [
              { role: "system", content: [{ type: "text", text: BASE_PROMPT }] },
              { role: "user", content: [{ type: "text", text: userPrompt }] },
            ],
            text: {
              format: {
                type: "json_schema",
                name: "past_life_reading",
                schema,
                strict: true,
              },
            },
          },
        });

        const resultJson = extractStructuredJson(response);

        const auraPrompt = `${resultJson.aura.image_prompt}\nスタイル: ${AURA_STYLE}`;
        const auraImageBase64 = await generateImage({
          apiKey: env.OPENAI_API_KEY,
          prompt: auraPrompt,
        });

        if (!auraImageBase64) {
          throw new Error("No image generated");
        }

        const resultId = crypto.randomUUID();
        const stored = {
          result_json: resultJson,
          aura_image: auraImageBase64,
          created_at: new Date().toISOString(),
        };

        await env.PASTLIFE_KV.put(resultId, JSON.stringify(stored), {
          metadata: { created_at: stored.created_at },
        });

        return jsonResponse({
          result_id: resultId,
          result_json: resultJson,
          aura_image: `data:image/png;base64,${auraImageBase64}`,
        });
      } catch (error) {
        return errorResponse("Generation failed", 500);
      }
    }

    if (url.pathname === "/result" && request.method === "GET") {
      try {
        if (!env.PASTLIFE_KV) {
          return errorResponse("PASTLIFE_KV is not set", 500);
        }

        const resultId = url.searchParams.get("id");
        if (!resultId) {
          return errorResponse("Missing id", 400);
        }

        const stored = await env.PASTLIFE_KV.get(resultId, { type: "json" });
        if (!stored) {
          return errorResponse("Not found", 404);
        }

        return jsonResponse({
          result_id: resultId,
          result_json: stored.result_json,
          aura_image: `data:image/png;base64,${stored.aura_image}`,
          created_at: stored.created_at,
        });
      } catch (error) {
        return errorResponse("Failed to load result", 500);
      }
    }

    return errorResponse("Not found", 404);
  },
};
