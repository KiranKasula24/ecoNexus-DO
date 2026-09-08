import compromise from "compromise";
import {
  ParsedInvoiceData,
  InvoiceLineItem,
  IdentifiedMaterial,
} from "@/types/material";
import { getMaterialProperties } from "@/lib/constants/material-database";

// ============================================
// INVOICE PARSING ENGINE
// ============================================

export async function parseInvoicePDF(pdfBuffer: Buffer): Promise<{
  text: string;
  parsed: ParsedInvoiceData;
  materials: IdentifiedMaterial[];
  confidence: number;
}> {
  try {
    // 🔥 Dynamic import (fixes ESM issue)
    const pdfModule = await import("pdf-parse");
    const pdfParse = (pdfModule as any).default || pdfModule;

    // Step 1: Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Step 2: Parse structured data
    const parsed = parseInvoiceText(text);

    // Step 3: Identify materials
    const materials = identifyMaterials(parsed);

    // Step 4: Calculate confidence
    const confidence = calculateConfidence(parsed, materials);

    return {
      text,
      parsed,
      materials,
      confidence,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF");
  }
}

// ============================================
// TEXT PARSING
// ============================================

function parseInvoiceText(text: string): ParsedInvoiceData {
  const doc = compromise(text);

  // Extract invoice number
  const invoiceNumber = extractInvoiceNumber(text);

  // Extract date
  const date = extractDate(text);

  // Extract supplier/customer
  const supplier = extractSupplier(text);

  // Extract line items
  const lineItems = extractLineItems(text);

  // Extract total
  const totalAmount = extractTotalAmount(text);

  return {
    invoice_number: invoiceNumber,
    date,
    supplier,
    total_amount: totalAmount,
    currency: "EUR", // default, could be extracted
    line_items: lineItems,
  };
}

function extractInvoiceNumber(text: string): string | undefined {
  // Common patterns: "Invoice #12345", "Inv. No: 12345", "Invoice Number: 12345"
  const patterns = [
    /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /inv\.?\s*no\.?\s*:?\s*([A-Z0-9-]+)/i,
    /invoice\s*number\s*:?\s*([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

function extractDate(text: string): string | undefined {
  // Match dates like: 2024-01-15, 15/01/2024, Jan 15, 2024
  const datePatterns = [
    /\d{4}-\d{2}-\d{2}/,
    /\d{2}\/\d{2}\/\d{4}/,
    /\d{2}\.\d{2}\.\d{4}/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return undefined;
}

function extractSupplier(text: string): string | undefined {
  // Look for company names near "From:", "Supplier:", or at the top
  const lines = text.split("\n").slice(0, 10); // first 10 lines

  for (const line of lines) {
    if (line.match(/\b(GmbH|Ltd|Inc|Corp|LLC|AG)\b/i)) {
      return line.trim();
    }
  }

  return undefined;
}

function extractLineItems(text: string): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    // Look for lines with quantities and prices
    // Pattern: Description ... Quantity Unit ... Price
    const match = line.match(
      /(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|ton|tons|l|m3|pcs|units?)?\s+.*?(\d+(?:\.\d+)?)\s*€?/i,
    );

    if (match) {
      const [_, description, quantity, unit, price] = match;

      items.push({
        description: description.trim(),
        quantity: parseFloat(quantity),
        unit: unit || "units",
        unit_price: parseFloat(price),
        total_price: parseFloat(quantity) * parseFloat(price),
        confidence: 0.7, // medium confidence from regex
      });
    }
  }

  // If no structured items found, try to extract material names
  if (items.length === 0) {
    const materialNames = extractMaterialNames(text);
    items.push(
      ...materialNames.map((name) => ({
        description: name,
        confidence: 0.5, // lower confidence
      })),
    );
  }

  return items;
}

function extractMaterialNames(text: string): string[] {
  const materials: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    // Check if line contains known material names
    const material = getMaterialProperties(line);

    if (material && !materials.includes(material.name)) {
      materials.push(material.name);
    }
  }

  return materials;
}

function extractTotalAmount(text: string): number | undefined {
  // Look for total amount patterns
  const patterns = [
    /total\s*:?\s*€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /sum\s*:?\s*€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /amount\s*:?\s*€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Remove commas and parse
      return parseFloat(match[1].replace(/,/g, ""));
    }
  }

  return undefined;
}

// ============================================
// MATERIAL IDENTIFICATION
// ============================================
function normalizeUnit(
  value: number,
  unit: string,
): { value: number; unit: string } {
  const normalized = unit.toLowerCase();

  switch (normalized) {
    case "ton":
    case "tons":
    case "tonne":
    case "tonnes":
      return { value: value * 1000, unit: "kg" };

    case "kg":
    case "kilogram":
    case "kilograms":
      return { value, unit: "kg" };

    case "g":
    case "gram":
    case "grams":
      return { value: value / 1000, unit: "kg" };

    case "lb":
    case "lbs":
      return { value: value * 0.453592, unit: "kg" };

    default:
      return { value, unit };
  }
}

function identifyMaterials(parsed: ParsedInvoiceData): IdentifiedMaterial[] {
  const identified: IdentifiedMaterial[] = [];
  const identifiedMaterialIds = new Set<string>();

  for (const item of parsed.line_items) {
    const material = getMaterialProperties(item.description);

    if (material && !identifiedMaterialIds.has(material.material_id)) {
      identifiedMaterialIds.add(material.material_id);

      // Determine if input or output based on context
      // Simple heuristic: if price is positive, it's likely an input (purchase)
      const category =
        item.unit_price && item.unit_price > 0 ? "input" : "output";

      // Normalize units
      const normalized =
        item.quantity && item.unit
          ? normalizeUnit(item.quantity, item.unit)
          : { value: item.quantity || 0, unit: item.unit || "units" };

      identified.push({
        material_type: material.name,
        category,
        quantity: normalized.value,
        unit: normalized.unit,
        cost: item.total_price,
        confidence: item.confidence * 0.9, // slightly reduce for material matching
        source: `Invoice ${parsed.invoice_number || "unknown"}`,
      });
    }
  }

  return identified;
}

// ============================================
// CONFIDENCE CALCULATION
// ============================================

function calculateConfidence(
  parsed: ParsedInvoiceData,
  materials: IdentifiedMaterial[],
): number {
  let score = 0;
  let maxScore = 0;

  // Invoice number present (+20 points)
  maxScore += 20;
  if (parsed.invoice_number) score += 20;

  // Date present (+15 points)
  maxScore += 15;
  if (parsed.date) score += 15;

  // Supplier present (+15 points)
  maxScore += 15;
  if (parsed.supplier) score += 15;

  // Line items present (+25 points)
  maxScore += 25;
  if (parsed.line_items.length > 0) {
    score += Math.min(parsed.line_items.length * 5, 25);
  }

  // Materials identified (+25 points)
  maxScore += 25;
  if (materials.length > 0) {
    score += Math.min(materials.length * 8, 25);
  }

  return Math.round((score / maxScore) * 100);
}

// ============================================
// EXPORT MAIN FUNCTION
// ============================================

export { parseInvoiceText, identifyMaterials };
