import * as XLSX from "xlsx";

export type ExcelProductRow = {
  product_code: string;
  product_name: string;
  reporting_period?: string;
  locality?: string;
};

export type ExcelInputRow = {
  product_code: string;
  input_sku: string;
  input_material: string;
  monthly_volume: number;
  unit: string;
  cost_per_unit: number;
  supplier?: string;
  quality_tier?: number;
};

export type ExcelOutputRow = {
  product_code: string;
  waste_sku: string;
  waste_material: string;
  monthly_volume: number;
  unit: string;
  current_disposal_cost: number;
  potential_value?: number;
  quality_grade?: string;
  contamination_level?: number;
  classification?: string;
  asking_price?: number;
};

export type ParsedExcelPassportPayload = {
  products: ExcelProductRow[];
  inputs: ExcelInputRow[];
  outputs: ExcelOutputRow[];
  errors: string[];
};

function norm(v: unknown): string {
  return String(v ?? "").trim();
}

function upper(v: unknown): string {
  return norm(v).toUpperCase();
}

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function assertSheets(wb: XLSX.WorkBook): string[] {
  const required = ["products", "inputs", "outputs"];
  const missing = required.filter((name) => !wb.SheetNames.includes(name));
  return missing.map((m) => `Missing required sheet: ${m}`);
}

export function parsePassportExcel(buffer: Buffer): ParsedExcelPassportPayload {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const errors = assertSheets(wb);
  if (errors.length > 0) return { products: [], inputs: [], outputs: [], errors };

  const productsRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets.products, {
    defval: "",
  });
  const inputsRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets.inputs, {
    defval: "",
  });
  const outputsRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets.outputs, {
    defval: "",
  });

  const products: ExcelProductRow[] = [];
  for (let i = 0; i < productsRaw.length; i++) {
    const row = productsRaw[i];
    const product_code = upper(row.product_code || row.product_id || row.product);
    const product_name = norm(row.product_name || row.name);
    if (!product_code || !product_name) {
      errors.push(`products row ${i + 2}: product_code and product_name are required`);
      continue;
    }
    products.push({
      product_code,
      product_name,
      reporting_period: norm(row.reporting_period || row.period) || undefined,
      locality: norm(row.locality) || undefined,
    });
  }

  const inputs: ExcelInputRow[] = [];
  for (let i = 0; i < inputsRaw.length; i++) {
    const row = inputsRaw[i];
    const product_code = upper(row.product_code || row.product_id || row.product);
    const input_sku = upper(row.input_sku || row.sku);
    const input_material = norm(row.input_material || row.material || input_sku);
    const monthly_volume = toNum(row.monthly_volume || row.volume);
    const unit = norm(row.unit || "tons") || "tons";
    const cost_per_unit = toNum(row.cost_per_unit || row.price || row.current_price);
    if (!product_code || !input_sku || monthly_volume <= 0) {
      errors.push(
        `inputs row ${i + 2}: product_code, input_sku and positive monthly_volume are required`,
      );
      continue;
    }
    inputs.push({
      product_code,
      input_sku,
      input_material,
      monthly_volume,
      unit,
      cost_per_unit,
      supplier: norm(row.supplier) || undefined,
      quality_tier: toNum(row.quality_tier || row.tier, NaN),
    });
  }

  const outputs: ExcelOutputRow[] = [];
  for (let i = 0; i < outputsRaw.length; i++) {
    const row = outputsRaw[i];
    const product_code = upper(row.product_code || row.product_id || row.product);
    const waste_sku = upper(row.waste_sku || row.sku);
    const waste_material = norm(row.waste_material || row.material || waste_sku);
    const monthly_volume = toNum(row.monthly_volume || row.volume);
    const unit = norm(row.unit || "tons") || "tons";
    const current_disposal_cost = toNum(
      row.current_disposal_cost || row.disposal_cost || row.cost_per_unit,
    );
    if (!product_code || !waste_sku || monthly_volume <= 0) {
      errors.push(
        `outputs row ${i + 2}: product_code, waste_sku and positive monthly_volume are required`,
      );
      continue;
    }
    outputs.push({
      product_code,
      waste_sku,
      waste_material,
      monthly_volume,
      unit,
      current_disposal_cost,
      potential_value: toNum(row.potential_value, NaN),
      quality_grade: norm(row.quality_grade) || undefined,
      contamination_level: toNum(row.contamination_level, NaN),
      classification: norm(row.classification || "recyclable") || "recyclable",
      asking_price: toNum(row.asking_price || row.price, NaN),
    });
  }

  const productCodes = new Set(products.map((p) => p.product_code));
  for (const input of inputs) {
    if (!productCodes.has(input.product_code)) {
      errors.push(`inputs: product_code ${input.product_code} not found in products sheet`);
    }
  }
  for (const output of outputs) {
    if (!productCodes.has(output.product_code)) {
      errors.push(`outputs: product_code ${output.product_code} not found in products sheet`);
    }
  }

  return { products, inputs, outputs, errors };
}

