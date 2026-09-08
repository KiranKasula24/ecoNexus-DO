import { NextRequest, NextResponse } from "next/server";
import { parsePassportExcel } from "@/lib/passport/excel-passport-parser";
import { ingestProductPassportWorkbook } from "@/lib/passport/product-passport-service";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const companyId = String(form.get("company_id") || "").trim();
    const sourceDocVersion =
      String(form.get("source_doc_version") || "").trim() || "excel-passport-v1";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 });
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Only .xlsx/.xls files are supported for passport upload" },
        { status: 400 },
      );
    }

    const parsed = parsePassportExcel(Buffer.from(await file.arrayBuffer()));
    if (parsed.errors.length > 0) {
      return NextResponse.json(
        {
          error: "Excel validation failed",
          validation_errors: parsed.errors,
        },
        { status: 422 },
      );
    }

    const result = await ingestProductPassportWorkbook({
      companyId,
      fileName: file.name,
      sourceDocVersion,
      products: parsed.products,
      inputs: parsed.inputs,
      outputs: parsed.outputs,
    });

    return NextResponse.json({
      success: true,
      ...result,
      next_redirect: "/nexus",
    });
  } catch (error: any) {
    console.error("Excel passport upload failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process excel passport upload" },
      { status: 500 },
    );
  }
}

