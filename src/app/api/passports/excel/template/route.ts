import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

function makeTemplateWorkbookBuffer(): Buffer {
  const products = [
    {
      product_code: "PRD-001",
      product_name: "Injection Molded Component",
      reporting_period: "2026-Q2",
      locality: "Pune",
    },
  ];

  const inputs = [
    {
      product_code: "PRD-001",
      input_sku: "PP-001",
      input_material: "Polypropylene Resin",
      monthly_volume: 120,
      unit: "tons",
      cost_per_unit: 980,
      supplier: "Supplier A",
      quality_tier: 3,
    },
    {
      product_code: "PRD-001",
      input_sku: "ADD-101",
      input_material: "Color Additive",
      monthly_volume: 4,
      unit: "tons",
      cost_per_unit: 2200,
      supplier: "Supplier B",
      quality_tier: 2,
    },
  ];

  const outputs = [
    {
      product_code: "PRD-001",
      waste_sku: "WPL-011",
      waste_material: "Mixed Plastic Scrap",
      monthly_volume: 14,
      unit: "tons",
      current_disposal_cost: 140,
      potential_value: 90,
      quality_grade: "C",
      contamination_level: 12,
      classification: "recyclable",
      asking_price: 85,
    },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(products), "products");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(inputs), "inputs");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(outputs), "outputs");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function GET() {
  const fileBuffer = makeTemplateWorkbookBuffer();
  const body = new Uint8Array(fileBuffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="econexus_passport_template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
