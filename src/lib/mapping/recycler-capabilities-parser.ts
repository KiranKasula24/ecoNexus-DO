import JSZip from "jszip";
import { getMaterialBySKU } from "@/lib/constants/materials";

export type ParsedCapabilityMapping = {
  waste_sku: string;
  processed_sku: string;
  quality_score: number | null;
  cost_competitiveness_score: number | null;
  recovery_score: number | null;
  market_demand_score: number | null;
  industry_segment: string | null;
  confidence: number;
};

export type ParsedCapabilityException = {
  source: "capabilities";
  row_ref: string;
  waste_sku: string | null;
  processed_sku: string | null;
  reason: string;
  payload: Record<string, unknown>;
};

const WASTE_SKU_RE = /^W[A-Z]{2,3}-\d{3}$/i;
const PROCESSED_SKU_RE = /^[A-Z]{2,4}-\d{3}$/i;
const SCORE_RE = /([1-5])\/5/g;
const INDUSTRY_SEGMENT_RE = /^\d+\.\s+/;

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeSku(raw: string | null | undefined): string {
  return String(raw || "").trim().toUpperCase();
}

function isValidWasteSku(sku: string): boolean {
  return WASTE_SKU_RE.test(sku);
}

function isValidProcessedSku(sku: string): boolean {
  return PROCESSED_SKU_RE.test(sku);
}

function extractScoreTokens(windowTokens: string[]): number[] {
  const found: number[] = [];
  for (const token of windowTokens) {
    let match: RegExpExecArray | null;
    while ((match = SCORE_RE.exec(token)) !== null) {
      found.push(Number(match[1]));
      if (found.length >= 4) return found;
    }
    SCORE_RE.lastIndex = 0;
  }
  return found;
}

function extractTextTokensFromDocXml(xml: string): string[] {
  const withBreaks = xml.replace(/<\/w:tr>/g, "\n").replace(/<\/w:p>/g, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeXmlEntities(noTags);
  return decoded
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export async function parseRecyclerCapabilitiesDocx(
  buffer: Buffer,
): Promise<{
  mappings: ParsedCapabilityMapping[];
  exceptions: ParsedCapabilityException[];
}> {
  const zip = await JSZip.loadAsync(buffer);
  const docEntry = zip.file("word/document.xml");
  if (!docEntry) {
    throw new Error("Invalid DOCX: word/document.xml not found");
  }

  const xml = await docEntry.async("string");
  const tokens = extractTextTokensFromDocXml(xml);
  const mappings: ParsedCapabilityMapping[] = [];
  const exceptions: ParsedCapabilityException[] = [];

  let currentSegment: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (INDUSTRY_SEGMENT_RE.test(token)) {
      currentSegment = token;
      continue;
    }

    const wasteSku = normalizeSku(token);
    if (!isValidWasteSku(wasteSku)) continue;

    let processedSku: string | null = null;
    let processedIndex = -1;
    for (let j = i + 1; j < Math.min(i + 10, tokens.length); j++) {
      const candidate = normalizeSku(tokens[j]);
      if (isValidProcessedSku(candidate)) {
        processedSku = candidate;
        processedIndex = j;
        break;
      }
    }

    if (!processedSku) {
      exceptions.push({
        source: "capabilities",
        row_ref: `token_${i}`,
        waste_sku: wasteSku,
        processed_sku: null,
        reason: "processed_sku_not_found",
        payload: { token_window: tokens.slice(i, i + 10) },
      });
      continue;
    }

    const scoreWindow = tokens.slice(i, Math.min(processedIndex + 16, tokens.length));
    const scores = extractScoreTokens(scoreWindow);
    const [quality, costComp, recovery, demand] = [
      scores[0] ?? null,
      scores[1] ?? null,
      scores[2] ?? null,
      scores[3] ?? null,
    ];

    const wasteKnown = !!getMaterialBySKU(wasteSku);
    const processedKnown = !!getMaterialBySKU(processedSku);
    const confidence = Number(
      (
        0.55 +
        (wasteKnown ? 0.1 : 0) +
        (processedKnown ? 0.1 : 0) +
        ((quality ?? 0) + (costComp ?? 0) + (recovery ?? 0) + (demand ?? 0)) / 100
      ).toFixed(3),
    );

    if (!wasteKnown || !processedKnown) {
      exceptions.push({
        source: "capabilities",
        row_ref: `token_${i}`,
        waste_sku: wasteSku,
        processed_sku: processedSku,
        reason: "sku_not_found_in_master_catalog",
        payload: { waste_known: wasteKnown, processed_known: processedKnown },
      });
    }

    mappings.push({
      waste_sku: wasteSku,
      processed_sku: processedSku,
      quality_score: quality,
      cost_competitiveness_score: costComp,
      recovery_score: recovery,
      market_demand_score: demand,
      industry_segment: currentSegment,
      confidence,
    });
  }

  const deduped = new Map<string, ParsedCapabilityMapping>();
  for (const mapping of mappings) {
    const key = `${mapping.waste_sku}::${mapping.processed_sku}`;
    const previous = deduped.get(key);
    if (!previous || mapping.confidence > previous.confidence) {
      deduped.set(key, mapping);
    }
  }

  return {
    mappings: Array.from(deduped.values()),
    exceptions,
  };
}
