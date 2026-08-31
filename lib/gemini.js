"use strict";

// Gemini API wrapper — uses only Node.js built-in https (zero npm dependencies).
// Supports single-turn generateContent and streaming (SSE) via streamGenerate.

const https = require("https");

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const BASE_HOST = "generativelanguage.googleapis.com";

/**
 * Single-turn generate (non-streaming).
 * @param {string} prompt
 * @param {Object} [opts]
 * @param {string} [opts.system]      System instruction
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @returns {Promise<string>}         Plain text response
 */
async function generate(prompt, opts = {}) {
  const body = JSON.stringify({
    system_instruction: opts.system
      ? { parts: [{ text: opts.system }] }
      : undefined,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 1024,
    },
  });

  const path = `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: BASE_HOST, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            const d = JSON.parse(raw);
            if (d.error) return reject(new Error(d.error.message || JSON.stringify(d.error)));
            const text = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            resolve(text.trim());
          } catch (e) {
            reject(new Error("Bad JSON from Gemini: " + raw.slice(0, 200)));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Multi-turn chat generate.
 * @param {Array<{role:"user"|"model", text:string}>} history
 * @param {string} newUserMessage
 * @param {Object} [opts]
 * @returns {Promise<string>}
 */
async function chat(history, newUserMessage, opts = {}) {
  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: newUserMessage }] },
  ];

  const body = JSON.stringify({
    system_instruction: opts.system
      ? { parts: [{ text: opts.system }] }
      : undefined,
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.75,
      maxOutputTokens: opts.maxTokens ?? 1200,
    },
  });

  const path = `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: BASE_HOST, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            const d = JSON.parse(raw);
            if (d.error) return reject(new Error(d.error.message || JSON.stringify(d.error)));
            const text = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            resolve(text.trim());
          } catch (e) {
            reject(new Error("Bad JSON from Gemini: " + raw.slice(0, 200)));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Stream generate — calls onChunk(text) as chunks arrive, resolves with full text.
 * Uses the streamGenerateContent endpoint with alt=sse.
 * @param {string} prompt
 * @param {function(string):void} onChunk
 * @param {Object} [opts]
 * @returns {Promise<string>}
 */
async function stream(prompt, onChunk, opts = {}) {
  const body = JSON.stringify({
    system_instruction: opts.system
      ? { parts: [{ text: opts.system }] }
      : undefined,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 1200,
    },
  });

  const path = `/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;
  let fullText = "";

  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: BASE_HOST, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let buffer = "";
        res.on("data", (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            try {
              const d = JSON.parse(raw);
              const piece = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (piece) { fullText += piece; onChunk(piece); }
            } catch {}
          }
        });
        res.on("end", () => resolve(fullText.trim()));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Career matching — returns an array of AI-suggested careers based on profile.
 * @param {{ role:string, skills:string[], education:string }} profile
 * @returns {Promise<Array<{title:string,reason:string,salary:string}>>}
 */
async function suggestCareers(profile) {
  const prompt = `You are a career counselor AI. Based on the following profile, suggest 6 high-growth tech careers.

Profile:
- Current/Recent Role: ${profile.role}
- Key Skills: ${(profile.skills || []).join(", ") || "not specified"}
- Education: ${profile.education || "not specified"}

Return ONLY a valid JSON array (no markdown, no explanation) with this exact shape:
[
  {"title": "Career Title", "reason": "1-sentence why this fits them", "salary": "$XXX,XXX / yr", "match": "XX%"},
  ...6 items...
]`;

  const raw = await generate(prompt, { temperature: 0.6, maxTokens: 800 });
  // strip any markdown code fences
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(cleaned); }
  catch { return []; }
}

module.exports = { generate, chat, stream, suggestCareers, MODEL };
