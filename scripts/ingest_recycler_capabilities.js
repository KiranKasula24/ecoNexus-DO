/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { createClient } = require("@supabase/supabase-js");
const dns = require("node:dns/promises");

const WASTE_SKU_RE = /^W[A-Z]{2,3}-\d{3}$/i;
const PROCESSED_SKU_RE = /^[A-Z]{2,4}-\d{3}$/i;
const SCORE_RE = /([1-5])\/5/g;
const INDUSTRY_SEGMENT_RE = /^\d+\.\s+/;

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const result = {};
  if (!fs.existsSync(envPath)) return result;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
    result[k] = v;
  }
  return result;
}

function sanitizeEnvValue(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
}

async function validateSupabaseHost(url) {
  try {
    const parsed = new URL(url);
    await dns.lookup(parsed.hostname);
    return null;
  } catch (error) {
    return error;
  }
}

function decodeXmlEntities(input) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractScoreTokens(tokens) {
  const scores = [];
  for (const token of tokens) {
    let match;
    while ((match = SCORE_RE.exec(token)) !== null) {
      scores.push(Number(match[1]));
      if (scores.length >= 4) return scores;
    }
    SCORE_RE.lastIndex = 0;
  }
  return scores;
}

function tokenizeDocXml(xml) {
  const withBreaks = xml.replace(/<\/w:tr>/g, "\n").replace(/<\/w:p>/g, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeXmlEntities(noTags);
  return decoded
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function parseDocxMappings(filePath) {
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) throw new Error("word/document.xml not found in DOCX");
  const xml = await docXml.async("string");
  const tokens = tokenizeDocXml(xml);

  const mappings = [];
  const exceptions = [];
  let currentSegment = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = String(tokens[i] || "").trim();
    if (INDUSTRY_SEGMENT_RE.test(token)) {
      currentSegment = token;
      continue;
    }
    if (!WASTE_SKU_RE.test(token)) continue;

    let processed = null;
    let processedIndex = -1;
    for (let j = i + 1; j < Math.min(i + 10, tokens.length); j++) {
      const candidate = String(tokens[j] || "").trim().toUpperCase();
      if (PROCESSED_SKU_RE.test(candidate)) {
        processed = candidate;
        processedIndex = j;
        break;
      }
    }

    if (!processed) {
      exceptions.push({
        source: "capabilities",
        row_ref: `token_${i}`,
        waste_sku: token.toUpperCase(),
        processed_sku: null,
        reason: "processed_sku_not_found",
        payload: { token_window: tokens.slice(i, i + 10) },
      });
      continue;
    }

    const scores = extractScoreTokens(tokens.slice(i, Math.min(processedIndex + 16, tokens.length)));
    const quality = scores[0] || null;
    const costComp = scores[1] || null;
    const recovery = scores[2] || null;
    const demand = scores[3] || null;
    const confidence = Number(
      (0.55 + ((quality || 0) + (costComp || 0) + (recovery || 0) + (demand || 0)) / 100).toFixed(3),
    );

    mappings.push({
      waste_sku: token.toUpperCase(),
      processed_sku: processed,
      source: "capabilities",
      quality_score: quality,
      cost_competitiveness_score: costComp,
      recovery_score: recovery,
      market_demand_score: demand,
      industry_segment: currentSegment,
      confidence,
      is_active: true,
    });
  }

  const dedupe = new Map();
  for (const row of mappings) {
    const key = `${row.waste_sku}::${row.processed_sku}`;
    if (!dedupe.has(key) || row.confidence > dedupe.get(key).confidence) {
      dedupe.set(key, row);
    }
  }
  return { mappings: Array.from(dedupe.values()), exceptions };
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = sanitizeEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const serviceRole = sanitizeEnvValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
  );
  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  const dnsError = await validateSupabaseHost(supabaseUrl);
  if (dnsError) {
    throw new Error(
      `Cannot resolve Supabase host from URL "${supabaseUrl}". ` +
        `Check internet/DNS or fix NEXT_PUBLIC_SUPABASE_URL in .env.local. Root: ${dnsError.message}`,
    );
  }

  const docPath =
    process.argv[2] || "C:\\Users\\kiran\\OneDrive\\Desktop\\EcoNexus_Recycler_Capabilities.docx";
  const version = process.argv[3] || `recycler-capabilities-${new Date().toISOString().slice(0, 10)}`;
  if (!fs.existsSync(docPath)) throw new Error(`Document not found: ${docPath}`);

  const supabase = createClient(supabaseUrl, serviceRole);
  const { mappings, exceptions } = await parseDocxMappings(docPath);
  console.log(`Parsed mappings: ${mappings.length}, exceptions: ${exceptions.length}`);

  await supabase
    .from("recycler_capability_mappings")
    .update({ is_active: false })
    .eq("source_doc_version", version);

  if (mappings.length > 0) {
    const records = mappings.map((x) => ({ ...x, source_doc_version: version }));
    const { error } = await supabase
      .from("recycler_capability_mappings")
      .upsert(records, { onConflict: "waste_sku,processed_sku,source_doc_version" });
    if (error) throw error;
  }

  if (exceptions.length > 0) {
    const { error } = await supabase.from("sku_mapping_exceptions").insert(exceptions);
    if (error) throw error;
  }

  console.log("Ingestion complete.");
}

main().catch((error) => {
  if (error?.code === "PGRST205" || String(error?.message || "").includes("Could not find table")) {
    console.error(
      "Missing Supabase tables. Apply SQL migrations first:\n" +
        "1) supabase/migrations/20260408_processed_sku_mappings.sql\n" +
        "2) supabase/migrations/20260408_product_passport_excel_workflow.sql",
    );
  }
  console.error(error);
  process.exit(1);
});
