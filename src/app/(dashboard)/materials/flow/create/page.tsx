"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type UploadResult = {
  success: boolean;
  job_id: string;
  product_passports_created: number;
  input_lines_created: number;
  output_lines_created: number;
  offers_created: number;
  requests_created: number;
  product_passport_ids: string[];
  next_redirect?: string;
};

export default function MaterialFlowExcelUploadPage() {
  const router = useRouter();
  const { company } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [sourceDocVersion, setSourceDocVersion] = useState(
    `excel-passport-${new Date().toISOString().slice(0, 10)}`,
  );
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  const canUpload = useMemo(() => !!company?.id && !!file && !loading, [company?.id, file, loading]);

  const downloadTemplate = async () => {
    setError("");
    setDownloadingTemplate(true);
    try {
      const response = await fetch("/api/passports/excel/template", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "econexus_passport_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Template download failed");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!company?.id) {
      setError("Company context missing. Please login again.");
      return;
    }
    if (!file) {
      setError("Please choose an Excel file.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("company_id", company.id);
      formData.append("source_doc_version", sourceDocVersion.trim() || "excel-passport-v1");
      formData.append("file", file);

      const response = await fetch("/api/passports/excel/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        const validation = Array.isArray(data?.validation_errors)
          ? `\n${data.validation_errors.join("\n")}`
          : "";
        throw new Error((data?.error || "Excel upload failed") + validation);
      }

      setResult(data as UploadResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Excel Material Passport Upload</h1>
        <p className="text-gray-600">
          Upload one Excel workbook to create product-level passports with multiple inputs and
          waste outputs. Inputs generate request opportunities and outputs generate offer opportunities.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Workbook format</p>
        <p>Required sheets: <code>products</code>, <code>inputs</code>, <code>outputs</code>.</p>
        <p>Use SKU columns so mapping and processor deal logic can run immediately.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 whitespace-pre-line text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
          <p className="font-semibold">Upload successful</p>
          <p>Job: {result.job_id}</p>
          <p>Product passports created: {result.product_passports_created}</p>
          <p>Input lines: {result.input_lines_created} | Output lines: {result.output_lines_created}</p>
          <p>Marketplace posts: {result.requests_created} requests, {result.offers_created} offers</p>
          <button
            type="button"
            onClick={() => router.push(result.next_redirect || "/nexus")}
            className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Open Nexus
          </button>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Source Doc Version</label>
            <input
              value={sourceDocVersion}
              onChange={(e) => setSourceDocVersion(e.target.value)}
              className="w-full rounded-md border-gray-300"
              placeholder="excel-passport-v1"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-md border-gray-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={downloadingTemplate}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {downloadingTemplate ? "Downloading..." : "Download Template"}
          </button>
          <button
            type="submit"
            disabled={!canUpload}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Workbook"}
          </button>
        </div>
      </form>
    </div>
  );
}

