"use client";

import { useEffect, useMemo, useState } from "react";
import { useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

interface PassportCardProps {
  passportId: string;
}

type PassportDocument = {
  id: string;
  document_type: string | null;
  file_url: string;
  verification_status: string | null;
  created_at: string | null;
};

type PassportRecord = {
  id: string;
  material_category: string;
  material_subtype: string;
  physical_form: string;
  volume: number;
  unit: string;
  quality_grade: string | null;
  quality_tier: number | null;
  contamination_level: number | null;
  carbon_footprint: number | null;
  verification_status: string | null;
  verification_score: number | null;
  verification_provider: string | null;
  technical_properties?: {
    circular_opportunities?: {
      focus?: string;
      selfReuseOpportunities?: Array<{
        id: string;
        title: string;
        description: string;
        expectedImpact: string;
        feasibility: "high" | "medium" | "low";
      }>;
      alternateInputRoutes?: Array<{
        id: string;
        title: string;
        description: string;
        expectedImpact: string;
        feasibility: "high" | "medium" | "low";
      }>;
    };
  } | null;
  created_at: string | null;
  updated_at: string | null;
};

export function PassportCard({ passportId }: PassportCardProps) {
  const { company, user } = useAuth();
  const [passport, setPassport] = useState<PassportRecord | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [documents, setDocuments] = useState<PassportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("lab_report");
  const [verificationMethod, setVerificationMethod] = useState<
    "document" | "lab_test" | "sensor" | "visual_inspection"
  >("document");

  const hasUploadedDocuments = documents.length > 0;
  const isVerified = passport?.verification_status === "verified";

  const generatedTimestamp = useMemo(() => {
    if (!passport?.created_at) return "N/A";
    return new Date(passport.created_at).toLocaleString();
  }, [passport?.created_at]);

  const circularOpportunities =
    passport?.technical_properties?.circular_opportunities;

  const fetchPassport = useCallback(async () => {
    const res = await fetch(`/api/digital-passport/${passportId}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch passport.");
    }
    setPassport(data.passport as PassportRecord);
  }, [passportId]);

  const fetchQRCode = useCallback(async () => {
    const res = await fetch(`/api/digital-passport/${passportId}/qr`);
    const data = await res.json();
    if (res.ok) {
      setQrCode(data.qr_code || "");
    }
  }, [passportId]);

  const fetchDocuments = useCallback(async () => {
    const res = await fetch(`/api/digital-passport/${passportId}/documents`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch documents.");
    }
    setDocuments((data.documents || []) as PassportDocument[]);
  }, [passportId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchPassport(), fetchQRCode(), fetchDocuments()]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load passport data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchDocuments, fetchPassport, fetchQRCode]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      setError("Select a document file first.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", documentType);
      formData.append(
        "uploaded_by",
        company?.id || user?.id || "unknown-uploader",
      );

      const res = await fetch(`/api/digital-passport/${passportId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Document upload failed.");
      }

      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Document upload failed.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPassport = async () => {
    if (!hasUploadedDocuments) {
      setError("Upload at least one verification document first.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const evidenceDocuments = documents.map((doc) => doc.file_url);
      const verifiedBy = company?.id || user?.id || "manual-verifier";

      const verifyRes = await fetch(`/api/digital-passport/${passportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: verificationMethod,
          verified_by: verifiedBy,
          findings: `Verification completed using ${verificationMethod} with uploaded evidence.`,
          evidence_documents: evidenceDocuments,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Passport verification failed.");
      }

      const approveRes = await fetch(`/api/digital-passport/${passportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved_by: verifiedBy,
          approval_type: "verification",
          notes: "Approved after verification documents were reviewed.",
        }),
      });

      const approveData = await approveRes.json();
      if (!approveRes.ok) {
        console.warn("Approval step failed after verification:", approveData.error);
      }

      await Promise.all([fetchPassport(), fetchDocuments()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 border rounded-lg">Loading passport...</div>;
  }

  if (!passport) {
    return (
      <div className="p-6 border rounded-lg text-red-600">Passport not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="border rounded-lg shadow-lg p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Generated Waste-Stream Passport</h2>
            <p className="text-sm text-gray-500">ID: {passport.id}</p>
            <p className="text-xs text-gray-500">Generated at: {generatedTimestamp}</p>
          </div>
          {qrCode && (
            <Image
              src={qrCode}
              alt="Passport QR"
              width={96}
              height={96}
              className="w-24 h-24"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="font-semibold capitalize">{passport.material_category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Subtype</p>
            <p className="font-semibold capitalize">{passport.material_subtype}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Physical Form</p>
            <p className="font-semibold capitalize">{passport.physical_form}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Volume</p>
            <p className="font-semibold">
              {passport.volume} {passport.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Quality</p>
            <p className="font-semibold">
              {passport.quality_grade || "N/A"} (Tier {passport.quality_tier || "-"})
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Contamination</p>
            <p className="font-semibold">{passport.contamination_level || 0}%</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">
            Verification status:{" "}
            <span className="font-semibold">
              {passport.verification_status || "unverified"}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Verification score: {passport.verification_score || 0}/100
          </p>
        </div>
      </div>

      {circularOpportunities && (
        <div className="border rounded-lg shadow-lg p-6 bg-white space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              Circular Opportunities ({circularOpportunities.focus || "general"})
            </h3>
            <p className="text-sm text-gray-600">
              Suggested pathways generated after material flow analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Self-Reuse Pathways</h4>
              {(circularOpportunities.selfReuseOpportunities || []).length === 0 ? (
                <p className="text-sm text-gray-500">No specific self-reuse pathways.</p>
              ) : (
                (circularOpportunities.selfReuseOpportunities || []).map((opp) => (
                  <div key={opp.id} className="border rounded-md p-3">
                    <p className="font-medium text-sm">{opp.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{opp.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Impact: {opp.expectedImpact}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Alternate Input Routes</h4>
              {(circularOpportunities.alternateInputRoutes || []).length === 0 ? (
                <p className="text-sm text-gray-500">No alternate input routes.</p>
              ) : (
                (circularOpportunities.alternateInputRoutes || []).map((opp) => (
                  <div key={opp.id} className="border rounded-md p-3">
                    <p className="font-medium text-sm">{opp.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{opp.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Impact: {opp.expectedImpact}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg shadow-lg p-6 bg-white space-y-4">
        <h3 className="text-lg font-semibold">Upload Verification Evidence</h3>
        <p className="text-sm text-gray-600">
          Upload a PDF or file, then verify this waste-stream passport.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="rounded-md border border-gray-300 p-2"
          />
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="rounded-md border-gray-300"
          >
            <option value="lab_report">lab_report</option>
            <option value="certificate">certificate</option>
            <option value="inspection_report">inspection_report</option>
            <option value="invoice">invoice</option>
          </select>
          <button
            type="button"
            disabled={actionLoading || !selectedFile}
            onClick={handleUploadDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? "Uploading..." : "Upload File"}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">
            Uploaded documents ({documents.length})
          </p>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-1">
              {documents.map((doc) => (
                <li key={doc.id} className="text-sm text-gray-700">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {doc.document_type || "document"} ({doc.verification_status || "pending"})
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <select
            value={verificationMethod}
            onChange={(e) =>
              setVerificationMethod(
                e.target.value as "document" | "lab_test" | "sensor" | "visual_inspection",
              )
            }
            className="rounded-md border-gray-300"
          >
            <option value="document">document</option>
            <option value="lab_test">lab_test</option>
            <option value="sensor">sensor</option>
            <option value="visual_inspection">visual_inspection</option>
          </select>
          <button
            type="button"
            disabled={actionLoading || !hasUploadedDocuments}
            onClick={handleVerifyPassport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {actionLoading ? "Verifying..." : "Verify Passport"}
          </button>
        </div>
      </div>

      {isVerified && (
        <div className="border rounded-lg shadow-lg p-6 bg-green-50 border-green-200">
          <h3 className="text-xl font-semibold text-green-900">
            Final Passport (Verified)
          </h3>
          <p className="text-sm text-green-800 mt-2">
            This waste-stream passport is verified and ready for downstream use.
          </p>
          <p className="text-sm text-green-800">
            Final verification score: {passport.verification_score || 0}/100
          </p>
          <p className="text-sm text-green-800">
            Verified by: {passport.verification_provider || "N/A"}
          </p>
        </div>
      )}
    </div>
  );
}
