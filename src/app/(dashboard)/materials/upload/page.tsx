"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMaterialProperties,
  searchMaterials,
} from "@/lib/constants/material-database";

export default function MaterialUploadPage() {
  const { company } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setWarnings([]);
    }
  };

  const handleUpload = async () => {
    if (!file || !company) {
      alert("Please select a file");
      return;
    }

    setUploading(true);
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("company_id", company.id);

      const res = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Check materials against database
      const materialWarnings: string[] = [];

      if (data.materials_identified) {
        for (const material of data.materials_identified) {
          const props = getMaterialProperties(material.material_type);

          if (!props) {
            materialWarnings.push(
              ` Material "${material.material_type}" not found in database. Environmental/economic KPIs may be incomplete.`,
            );
          } else {
            // Check if cost is reasonable
            const cost = material.cost || 0;
            const volume = material.quantity || 0;
            if (volume > 0 && cost > 0) {
              const costPerUnit = cost / volume;
              const avgPrice = props.market_price.average;

              if (costPerUnit > avgPrice * 1.5) {
                materialWarnings.push(
                  ` ${material.material_type}: Your cost (${costPerUnit.toFixed(2)}/ton) is significantly above market average (${avgPrice}/ton). Consider circular alternatives.`,
                );
              } else if (costPerUnit < avgPrice * 0.5) {
                materialWarnings.push(
                  ` ${material.material_type}: Great price! You're paying below market average.`,
                );
              }
            }
          }
        }
      }

      setWarnings(materialWarnings);
      setResult(data);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Invoice</h1>
        <p className="mt-2 text-gray-600">
          Upload material invoices for automated analysis
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PDF Invoice
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
          </div>

          {file && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Selected:</span> {file.name} (
                {(file.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {uploading ? "Uploading & Analyzing..." : "Upload Invoice"}
          </button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
             Material Analysis Warnings
          </h3>
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-800">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {result.invoice ? " Upload Successful" : " Upload Failed"}
          </h2>

          {result.materials_identified &&
            result.materials_identified.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">
                  Materials Identified: {result.materials_identified.length}
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Database Match
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.materials_identified.map(
                        (material: any, index: number) => {
                          const props = getMaterialProperties(
                            material.material_type,
                          );
                          const hasMatch = !!props;

                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {material.material_type}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {material.category}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.quantity} {material.unit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.cost?.toFixed(2) || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {hasMatch ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                     Found
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                     Missing
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(material.confidence * 100).toFixed(0)}%
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Action Button */}
          {result.invoice && (
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => {
                  // Navigate to KPI dashboard
                  window.location.href = "/kpi_analytics";
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                View KPIs
              </button>

              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setWarnings([]);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Upload Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

