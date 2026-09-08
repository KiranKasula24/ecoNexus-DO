"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";
import {
  getMaterialProperties,
  searchMaterials,
  getAllCategories,
} from "@/lib/constants/material-database";
import { calculateCircularSavings } from "@/lib/calculations/economic-kpis";

interface MaterialRequirement {
  id: string;
  material_type: string;
  volume: number;
  unit: string;
  current_cost_per_unit: number;
  current_supplier: string;
  purpose: string;
  frequency: "one-time" | "monthly" | "quarterly" | "annual";
}

export default function MaterialRequirementsPage() {
  const router = useRouter();
  const { company } = useAuth();
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [formData, setFormData] = useState({
    material_type: "",
    volume: "",
    unit: "tons",
    current_cost_per_unit: "",
    current_supplier: "",
    purpose: "",
    frequency: "monthly" as MaterialRequirement["frequency"],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  // Material search with autocomplete
  const handleMaterialSearch = (value: string) => {
    setSearchTerm(value);
    setFormData({ ...formData, material_type: value });

    if (value.length >= 2) {
      const results = searchMaterials(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select material from suggestions
  const selectMaterial = (material: any) => {
    setSearchTerm(material.subtype);
    setFormData({
      ...formData,
      material_type: material.material_id,
      current_cost_per_unit: material.market_price.average.toString(),
      unit: "tons",
    });
    setSelectedMaterial(material);
    setShowSuggestions(false);
  };

  // Add requirement to list
  const addRequirement = () => {
    if (
      !formData.material_type ||
      !formData.volume ||
      !formData.current_cost_per_unit
    ) {
      alert("Please fill in required fields: Material, Volume, Cost");
      return;
    }

    const newRequirement: MaterialRequirement = {
      id: Date.now().toString(),
      material_type: formData.material_type,
      volume: parseFloat(formData.volume),
      unit: formData.unit,
      current_cost_per_unit: parseFloat(formData.current_cost_per_unit),
      current_supplier: formData.current_supplier,
      purpose: formData.purpose,
      frequency: formData.frequency,
    };

    setRequirements([...requirements, newRequirement]);

    // Reset form
    setFormData({
      material_type: "",
      volume: "",
      unit: "tons",
      current_cost_per_unit: "",
      current_supplier: "",
      purpose: "",
      frequency: "monthly",
    });
    setSearchTerm("");
    setSelectedMaterial(null);
  };

  // Remove requirement
  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter((r) => r.id !== id));
  };

  // Save all requirements
  const saveRequirements = async () => {
    if (!company?.id) {
      alert("Company context missing. Please log in again.");
      return;
    }
    if (requirements.length === 0) {
      alert("No requirements to save.");
      return;
    }

    const rows = requirements.map((req) => {
      const material = getMaterialProperties(req.material_type);
      return {
        company_id: company.id,
        category: "input",
        material_type: req.material_type,
        material_category: material?.category || req.material_type,
        material_subtype: material?.subtype || req.material_type,
        monthly_volume: req.volume,
        unit: req.unit,
        cost_per_unit: req.current_cost_per_unit,
        technical_properties: {
          source_type: "requirement",
          frequency: req.frequency,
          current_supplier: req.current_supplier || null,
          purpose: req.purpose || null,
        },
      };
    });

    const { error } = await supabase.from("materials").insert(rows as any);
    if (error) {
      alert(`Failed to save requirements: ${error.message}`);
      return;
    }

    alert(`Saved ${requirements.length} material requirements.`);
    router.push("/materials/flow/create");
  };

  // Get all categories for filter
  const categories = getAllCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Material Requirements
        </h1>
        <p className="mt-2 text-gray-600">
          Define your material needs for production planning
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Add Material Requirement</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Material Type (with autocomplete) */}
          <div className="sm:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material Type *
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleMaterialSearch(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Search materials (e.g., steel, plastic, aluminum)"
            />

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((material) => (
                  <button
                    key={material.material_id}
                    onClick={() => selectMaterial(material)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {material.subtype} ({material.category})
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg. price: {material.market_price.average}/ton |
                      Recyclability: {material.recyclability_score}%
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume *
            </label>
            <input
              type="number"
              value={formData.volume}
              onChange={(e) =>
                setFormData({ ...formData, volume: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="50"
              min="0"
              step="0.1"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="tons">Tons</option>
              <option value="kg">Kilograms</option>
              <option value="m">Cubic Meters</option>
              <option value="liters">Liters</option>
            </select>
          </div>

          {/* Current Cost Per Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Cost (/unit) *
            </label>
            <input
              type="number"
              value={formData.current_cost_per_unit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  current_cost_per_unit: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="150"
              min="0"
              step="0.01"
            />
            {selectedMaterial && (
              <p className="text-xs text-gray-500 mt-1">
                Market average: {selectedMaterial.market_price.average}/
                {formData.unit}
              </p>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value as any })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="one-time">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          {/* Current Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Supplier (Optional)
            </label>
            <input
              type="text"
              value={formData.current_supplier}
              onChange={(e) =>
                setFormData({ ...formData, current_supplier: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Supplier name"
            />
          </div>

          {/* Purpose */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose (Optional)
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Component manufacturing, Packaging"
            />
          </div>
        </div>

        {/* Material Info Card (if selected) */}
        {selectedMaterial && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Material Information: {selectedMaterial.subtype}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Category:</span>{" "}
                {selectedMaterial.category}
              </div>
              <div>
                <span className="font-medium">Recyclability:</span>{" "}
                {selectedMaterial.recyclability_score}%
              </div>
              <div>
                <span className="font-medium">Market Price:</span>
                {selectedMaterial.market_price.min}-
                {selectedMaterial.market_price.max}/ton
              </div>
              <div>
                <span className="font-medium">Carbon (Virgin):</span>{" "}
                {selectedMaterial.carbon_footprint.virgin_production} kg CO/ton
              </div>
              <div>
                <span className="font-medium">Carbon (Recycled):</span>{" "}
                {selectedMaterial.carbon_footprint.recycling} kg CO/ton
              </div>
              <div>
                <span className="font-medium">Quality Tiers:</span>{" "}
                {selectedMaterial.quality_tiers.length} available
              </div>
            </div>
          </div>
        )}

        {/* Add Button */}
        <div className="mt-6">
          <button
            onClick={addRequirement}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add to List
          </button>
        </div>
      </div>

      {/* Requirements List */}
      {requirements.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Material Requirements ({requirements.length})
            </h2>
            <button
              onClick={saveRequirements}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Save All Requirements
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost/Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requirements.map((req) => {
                  const total = req.volume * req.current_cost_per_unit;
                  const material = getMaterialProperties(req.material_type);

                  return (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {material?.subtype || req.material_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {material?.category || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.volume} {req.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.current_cost_per_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {req.frequency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeRequirement(req.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total Monthly Cost (estimated):
              </span>
              <span className="text-lg font-bold text-gray-900">
                {requirements
                  .reduce((sum, req) => {
                    const cost = req.volume * req.current_cost_per_unit;
                    return (
                      sum + (req.frequency === "monthly" ? cost : cost / 12)
                    );
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
