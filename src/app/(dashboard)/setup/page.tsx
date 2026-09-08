"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";

export default function SetupPage() {
  const router = useRouter();
  const { company, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  const checkSetupStatus = async () => {
    if (!company) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("is_setup_complete")
        .eq("id", company.id)
        .maybeSingle();

      if (error) throw error;

      const isComplete = data?.is_setup_complete ?? false;
      setSetupComplete(isComplete);
      setLoading(false);

      if (isComplete) {
        router.push("/overview");
      }
    } catch (error) {
      console.error("Setup check error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!company) {
      setLoading(false);
      return;
    }
    checkSetupStatus();
  }, [company]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate setup component
  const renderSetup = () => {
    switch (company?.entity_type) {
      case "manufacturer":
        return <ManufacturerSetup />;
      case "recycler":
        return <RecyclerSetup />;
      case "processor":
        return <ProcessorSetup />;
      case "energy_recovery":
        return <ProcessorSetup />;
      case "logistics":
        return <LogisticsSetup />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-600">Unknown entity type</div>
          </div>
        );
    }
  };

  return <div className="min-h-screen bg-gray-50 py-8">{renderSetup()}</div>;
}

// ============================================
// MANUFACTURER SETUP
// ============================================
function ManufacturerSetup() {
  const router = useRouter();
  const { company } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState({
    production_description: "",
    primary_materials: [] as string[],
    monthly_production_volume: "",
    waste_generation_estimate: "",
  });

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!formData.production_description.trim()) {
      errors.production_description = "Please describe what you manufacture";
    }

    if (
      formData.primary_materials.length === 0 ||
      formData.primary_materials.every((m) => !m.trim())
    ) {
      errors.primary_materials = "Please specify primary materials";
    }

    if (!formData.monthly_production_volume.trim()) {
      errors.monthly_production_volume =
        "Please enter monthly production volume";
    } else if (isNaN(parseFloat(formData.monthly_production_volume))) {
      errors.monthly_production_volume = "Please enter a valid number";
    }

    if (!formData.waste_generation_estimate.trim()) {
      errors.waste_generation_estimate =
        "Please enter waste generation estimate";
    } else if (isNaN(parseFloat(formData.waste_generation_estimate))) {
      errors.waste_generation_estimate = "Please enter a valid number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      if (!company?.id) {
        throw new Error("Company ID is missing");
      }

      const { error } = await supabase
        .from("companies")
        .update({ is_setup_complete: true })
        .eq("id", company.id);

      if (error) throw error;

      await supabase
        .from("agents")
        .update({ status: "active" })
        .eq("company_id", company.id);

      router.push("/materials/requirements");
    } catch (error) {
      console.error("Setup error:", error);
      alert("Failed to complete setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white shadow rounded-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to EcoNexus!
          </h1>
          <p className="mt-2 text-gray-600">
            Let&apos;s set up your manufacturing profile and deploy your Nexa
            agent
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Setup Progress
            </span>
            <span className="text-sm font-medium text-gray-700">{step}/2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              Tell us about your production
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you manufacture? *
              </label>
              <textarea
                value={formData.production_description}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    production_description: e.target.value,
                  });
                  if (validationErrors.production_description) {
                    setValidationErrors({
                      ...validationErrors,
                      production_description: "",
                    });
                  }
                }}
                rows={3}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.production_description
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="e.g., Metal components for automotive industry"
              />
              {validationErrors.production_description && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.production_description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Materials Used *
              </label>
              <input
                type="text"
                value={formData.primary_materials.join(", ")}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    primary_materials: e.target.value
                      .split(",")
                      .map((m) => m.trim()),
                  });
                  if (validationErrors.primary_materials) {
                    setValidationErrors({
                      ...validationErrors,
                      primary_materials: "",
                    });
                  }
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.primary_materials
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="e.g., Steel, Aluminum, Copper (comma-separated)"
              />
              {validationErrors.primary_materials && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.primary_materials}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Production Volume (tons) *
                </label>
                <input
                  type="number"
                  value={formData.monthly_production_volume}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      monthly_production_volume: e.target.value,
                    });
                    if (validationErrors.monthly_production_volume) {
                      setValidationErrors({
                        ...validationErrors,
                        monthly_production_volume: "",
                      });
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.monthly_production_volume
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="100"
                />
                {validationErrors.monthly_production_volume && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.monthly_production_volume}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waste Generation (% of input) *
                </label>
                <input
                  type="number"
                  value={formData.waste_generation_estimate}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      waste_generation_estimate: e.target.value,
                    });
                    if (validationErrors.waste_generation_estimate) {
                      setValidationErrors({
                        ...validationErrors,
                        waste_generation_estimate: "",
                      });
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.waste_generation_estimate
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="15"
                />
                {validationErrors.waste_generation_estimate && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.waste_generation_estimate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Nexa Configuration */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Deploy Your Nexa Agent </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                What is Nexa?
              </h3>
              <p className="text-sm text-blue-800">
                Nexa is your autonomous AI agent that will:
              </p>
              <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Scan Nexus (our agent marketplace) for circular material
                  opportunities
                </li>
                <li>Negotiate deals with other agents on your behalf</li>
                <li>Find buyers for your waste streams</li>
                <li>Propose economically optimal deals for your approval</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Your Nexa Configuration
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Agent Name:</span>
                  <p className="text-gray-900">Nexa-{company?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="text-gray-900">Local Agent (Manufacturer)</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Geographic Range:
                  </span>
                  <p className="text-gray-900">50 km (configurable)</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-yellow-600">
                    Paused (activate after data input)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">
                 Next Steps
              </h3>
              <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                <li>Input your material requirements (what you need to buy)</li>
                <li>Upload invoices to track your materials and waste</li>
                <li>Review circular opportunities suggested by the system</li>
                <li>Activate Nexa to start autonomous negotiations</li>
              </ol>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : "Complete Setup & Go to Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// RECYCLER SETUP
// ============================================
function RecyclerSetup() {
  const router = useRouter();
  const { company } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    accepted_materials: [] as string[],
    processing_capacity: "",
    processing_methods: [] as string[],
    output_quality: [] as number[],
    min_pickup_volume: "5",
    max_contamination: "10",
    service_area: "regional" as "local" | "regional" | "national",
    processing_fees: {} as Record<string, number>,
    buy_prices: {} as Record<string, number>,
  });

  const materialCategories = [
    "metal",
    "plastic",
    "paper",
    "glass",
    "organic",
    "textile",
    "rubber",
  ];

  const processingMethods = ["mechanical", "chemical", "thermal", "biological"];
  const qualityTiers = [1, 2, 3, 4];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      if (!company?.id) {
        throw new Error("Company ID is missing");
      }

      // Update recycler profile
      const { error } = await supabase
        .from("recycler_profiles")
        .update({
          company_id: company.id,
          accepted_material_categories: formData.accepted_materials,
          processing_capacity_tons_month:
            parseFloat(formData.processing_capacity) || 0,
          processing_methods: formData.processing_methods,
          output_quality_tiers: formData.output_quality,
          min_pickup_volume_tons: parseFloat(formData.min_pickup_volume) || 0,
          max_contamination_tolerance:
            parseFloat(formData.max_contamination) || 0,
          geographic_service_area: formData.service_area,
          base_processing_fee_per_ton: formData.processing_fees,
          buy_prices_per_ton: formData.buy_prices,
          is_setup_complete: true,
        })
        .eq("company_id", company.id);

      if (error) {
        console.error("Error updating recycler profile:", error);
        throw error;
      }

      await supabase
        .from("companies")
        .update({is_setup_complete: true })
        .eq("id", company.id);

      // Update agent status to active
      const agentResponse = await supabase
        .from("agents")
        .update({ status: "active" })
        .eq("company_id", company.id);

      if (agentResponse.error) {
        console.error("Error updating agent status:", agentResponse.error);
        throw agentResponse.error;
      }

      router.push("/materials/requirements");
    } catch (error) {
      console.error("Setup error:", error);
      alert("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMaterial = (material: string) => {
    if (formData.accepted_materials.includes(material)) {
      setFormData({
        ...formData,
        accepted_materials: formData.accepted_materials.filter(
          (m) => m !== material,
        ),
      });
    } else {
      setFormData({
        ...formData,
        accepted_materials: [...formData.accepted_materials, material],
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white shadow rounded-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Recycler! 
          </h1>
          <p className="mt-2 text-gray-600">
            Set up your recycling operations and deploy your NexaPrime agent
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Setup Progress
            </span>
            <span className="text-sm font-medium text-gray-700">{step}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Materials & Capacity */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Processing Capabilities</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What materials do you accept? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {materialCategories.map((material) => (
                  <button
                    key={material}
                    onClick={() => toggleMaterial(material)}
                    className={`p-3 border-2 rounded-lg text-center font-medium transition-all ${
                      formData.accepted_materials.includes(material)
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {material.charAt(0).toUpperCase() + material.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Capacity (tons/month) *
              </label>
              <input
                type="number"
                value={formData.processing_capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processing_capacity: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Processing Methods
              </label>
              <div className="grid grid-cols-2 gap-3">
                {processingMethods.map((method) => (
                  <label key={method} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.processing_methods.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            processing_methods: [
                              ...formData.processing_methods,
                              method,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            processing_methods:
                              formData.processing_methods.filter(
                                (m) => m !== method,
                              ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {method}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Output Quality Tiers You Produce
              </label>
              <div className="grid grid-cols-4 gap-3">
                {qualityTiers.map((tier) => (
                  <label key={tier} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.output_quality.includes(tier)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            output_quality: [...formData.output_quality, tier],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            output_quality: formData.output_quality.filter(
                              (t) => t !== tier,
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Tier {tier}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (
                    formData.accepted_materials.length === 0 ||
                    !formData.processing_capacity
                  ) {
                    alert("Please fill in required fields");
                    return;
                  }
                  setStep(2);
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Operational Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Operational Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Pickup Volume (tons)
                </label>
                <input
                  type="number"
                  value={formData.min_pickup_volume}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_pickup_volume: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Contamination Tolerance (%)
                </label>
                <input
                  type="number"
                  value={formData.max_contamination}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_contamination: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Geographic Service Area
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["local", "regional", "national"] as const).map((area) => (
                  <button
                    key={area}
                    onClick={() =>
                      setFormData({ ...formData, service_area: area })
                    }
                    className={`p-3 border-2 rounded-lg text-center font-medium transition-all ${
                      formData.service_area === area
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {area.charAt(0).toUpperCase() + area.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing & Activation */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Pricing Strategy</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Buy Prices (/ton) - What you&apos;ll pay for waste
              </label>
              {formData.accepted_materials.map((material) => (
                <div
                  key={material}
                  className="flex items-center space-x-3 mb-3"
                >
                  <span className="w-24 text-sm font-medium text-gray-700 capitalize">
                    {material}:
                  </span>
                  <input
                    type="number"
                    placeholder="100"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buy_prices: {
                          ...formData.buy_prices,
                          [material]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">/ton</span>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Processing Fees (/ton) - If providing processing service
              </label>
              {formData.accepted_materials.map((material) => (
                <div
                  key={material}
                  className="flex items-center space-x-3 mb-3"
                >
                  <span className="w-24 text-sm font-medium text-gray-700 capitalize">
                    {material}:
                  </span>
                  <input
                    type="number"
                    placeholder="50"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        processing_fees: {
                          ...formData.processing_fees,
                          [material]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">/ton</span>
                </div>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">
                 Your NexaPrime Agent is Ready!
              </h3>
              <p className="text-sm text-green-800 mb-3">
                Once activated, your agent will:
              </p>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Scan ALL localities for matching waste streams</li>
                <li>Post buy requests across Nexus</li>
                <li>Negotiate with manufacturers&apos; agents</li>
                <li>Propose purchases for your approval</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : "Activate NexaPrime & Go to Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PROCESSOR SETUP
// ============================================
function ProcessorSetup() {
  const router = useRouter();
  const { company } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    input_materials: [] as string[],
    output_materials: [] as string[],
    processing_services: [] as string[],
    processing_capacity: "",
    service_area: "regional" as "local" | "regional" | "national",
    processing_fees: {} as Record<string, number>,
    value_model: "fee_based" as "fee_based" | "output_split" | "hybrid",
  });

  const availableInputs = [
    "metal-scrap",
    "plastic-scrap",
    "paper-waste",
    "glass-cullet",
    "organic-waste",
    "textile-waste",
    "rubber-waste",
    "by-products",
  ];

  const availableOutputs = [
    "recycled-metal",
    "recycled-plastic",
    "recycled-paper",
    "compost",
    "energy",
    "secondary-materials",
    "refined-materials",
  ];

  const processingServices = [
    "refining",
    "compounding",
    "extrusion",
    "pelletizing",
    "grinding",
    "washing",
    "sorting",
    "chemical-processing",
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      if (!company?.id) {
        throw new Error("Company ID is missing");
      }

      const { error } = await supabase
        .from("processor_profiles")
        .update({
          input_materials: formData.input_materials,
          output_materials: formData.output_materials,
          processing_services: formData.processing_services,
          processing_capacity_tons_month:
            parseFloat(formData.processing_capacity) || 0,
          geographic_service_area: formData.service_area,
          processing_fee_per_ton: formData.processing_fees,
          value_share_model: formData.value_model,
          is_setup_complete: true,
        })
        .eq("company_id", company.id);

      if (error) {
        console.error("Error updating processor profile:", error);
        throw error;
      }

      await supabase
        .from("companies")
        .update({ is_setup_complete: true })
        .eq("id", company.id);

      const agentResponse = await supabase
        .from("agents")
        .update({ status: "active" })
        .eq("company_id", company.id);

      if (agentResponse.error) {
        console.error("Error updating agent status:", agentResponse.error);
        throw agentResponse.error;
      }

      router.push("/materials/requirements");
    } catch (error) {
      console.error("Setup error:", error);
      alert("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white shadow rounded-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Processor! 
          </h1>
          <p className="mt-2 text-gray-600">
            Set up your processing services and deploy your NexaPrime agent
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Setup Progress
            </span>
            <span className="text-sm font-medium text-gray-700">{step}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Input/Output Materials */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Processing Capabilities</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What by-products/materials do you accept? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableInputs.map((material) => (
                  <label
                    key={material}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.input_materials.includes(material)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            input_materials: [
                              ...formData.input_materials,
                              material,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            input_materials: formData.input_materials.filter(
                              (m) => m !== material,
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      {material.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What outputs do you produce? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableOutputs.map((material) => (
                  <label
                    key={material}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.output_materials.includes(material)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            output_materials: [
                              ...formData.output_materials,
                              material,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            output_materials: formData.output_materials.filter(
                              (m) => m !== material,
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      {material.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (
                    formData.input_materials.length === 0 ||
                    formData.output_materials.length === 0
                  ) {
                    alert("Please select inputs and outputs");
                    return;
                  }
                  setStep(2);
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Services & Capacity */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Processing Services</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What processing services do you offer?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {processingServices.map((service) => (
                  <label
                    key={service}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.processing_services.includes(service)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            processing_services: [
                              ...formData.processing_services,
                              service,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            processing_services:
                              formData.processing_services.filter(
                                (s) => s !== service,
                              ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {service.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Capacity (tons/month) *
              </label>
              <input
                type="number"
                value={formData.processing_capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processing_capacity: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Area
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["local", "regional", "national"] as const).map((area) => (
                  <button
                    key={area}
                    onClick={() =>
                      setFormData({ ...formData, service_area: area })
                    }
                    className={`p-3 border-2 rounded-lg text-center font-medium transition-all ${
                      formData.service_area === area
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {area.charAt(0).toUpperCase() + area.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!formData.processing_capacity) {
                    alert("Please enter processing capacity");
                    return;
                  }
                  setStep(3);
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing Model */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Pricing Model</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Revenue Model
              </label>
              <div className="space-y-3">
                <button
                  onClick={() =>
                    setFormData({ ...formData, value_model: "fee_based" })
                  }
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    formData.value_model === "fee_based"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium">Fee-Based</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Charge a fixed processing fee per ton
                  </div>
                </button>

                <button
                  onClick={() =>
                    setFormData({ ...formData, value_model: "output_split" })
                  }
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    formData.value_model === "output_split"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium">Output Split</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Share revenue from selling processed output
                  </div>
                </button>

                <button
                  onClick={() =>
                    setFormData({ ...formData, value_model: "hybrid" })
                  }
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    formData.value_model === "hybrid"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium">Hybrid</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Base fee + percentage of output value
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Processing Fees (/ton)
              </label>
              {formData.input_materials.map((material) => (
                <div
                  key={material}
                  className="flex items-center space-x-3 mb-3"
                >
                  <span className="w-32 text-sm font-medium text-gray-700">
                    {material.replace("-", " ")}:
                  </span>
                  <input
                    type="number"
                    placeholder="75"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        processing_fees: {
                          ...formData.processing_fees,
                          [material]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600">/ton</span>
                </div>
              ))}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-2">
                 Your NexaPrime Agent is Ready!
              </h3>
              <p className="text-sm text-purple-800 mb-3">
                Your agent will help you:
              </p>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>Find by-products that need processing</li>
                <li>Match with buyers for your outputs</li>
                <li>Coordinate three-way deals (supplier  you  buyer)</li>
                <li>Optimize capacity utilization</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : "Activate NexaPrime & Go to Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// LOGISTICS SETUP
// ============================================
function LogisticsSetup() {
  const router = useRouter();
  const { company } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fleet_trucks: "",
    fleet_capacity: "",
    vehicle_types: [] as string[],
    service_regions: [] as string[],
    max_distance: "500",
    material_specializations: [] as string[],
    base_rate: "0.15",
    min_load: "5",
    consolidation_discount: "15",
    accepts_backhaul: true,
    optimization_priority: "cost" as "cost" | "speed" | "carbon" | "balanced",
  });

  const vehicleTypes = [
    "flatbed",
    "box-truck",
    "tanker",
    "refrigerated",
    "specialized",
  ];

  const regions = [
    "bavaria",
    "baden-wurttemberg",
    "north-rhine-westphalia",
    "hesse",
    "lower-saxony",
    "saxony",
  ];

  const materials = [
    "metal",
    "plastic",
    "liquid",
    "hazardous",
    "oversized",
    "temperature-sensitive",
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      if (!company?.id) {
        throw new Error("Company ID is missing");
      }

      const { error } = await supabase
        .from("logistics_profiles")
        .update({
          fleet_capacity: {
            trucks: parseInt(formData.fleet_trucks) || 0,
            total_capacity_tons: parseFloat(formData.fleet_capacity) || 0,
          } as any,
          vehicle_types: formData.vehicle_types,
          service_regions: formData.service_regions,
          max_distance_km: parseInt(formData.max_distance) || 0,
          material_specializations: formData.material_specializations,
          base_rate_per_ton_km: parseFloat(formData.base_rate) || 0,
          minimum_load_tons: parseFloat(formData.min_load) || 0,
          consolidation_discount_percentage:
            parseFloat(formData.consolidation_discount) || 0,
          optimization_priority: formData.optimization_priority,
          accepts_backhaul: formData.accepts_backhaul,
          is_setup_complete: true,
        } as any)
        .eq("company_id", company.id);

      if (error) {
        console.error("Error updating logistics profile:", error);
        throw error;
      }

      await supabase
        .from("companies")
        .update({ is_setup_complete: true })
        .eq("id", company.id);

      const agentResponse = await supabase
        .from("agents")
        .update({ status: "active" })
        .eq("company_id", company.id);

      if (agentResponse.error) {
        console.error("Error updating agent status:", agentResponse.error);
        throw agentResponse.error;
      }

      router.push("/materials/requirements");
    } catch (error) {
      console.error("Setup error:", error);
      alert("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white shadow rounded-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Logistics Provider! 
          </h1>
          <p className="mt-2 text-gray-600">
            Set up your fleet operations and deploy your NexaPrime agent
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Setup Progress
            </span>
            <span className="text-sm font-medium text-gray-700">{step}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Fleet Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Fleet Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Trucks *
                </label>
                <input
                  type="number"
                  value={formData.fleet_trucks}
                  onChange={(e) =>
                    setFormData({ ...formData, fleet_trucks: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Capacity (tons) *
                </label>
                <input
                  type="number"
                  value={formData.fleet_capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, fleet_capacity: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vehicle Types *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {vehicleTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.vehicle_types.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            vehicle_types: [...formData.vehicle_types, type],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            vehicle_types: formData.vehicle_types.filter(
                              (t) => t !== type,
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {type.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Material Specializations
              </label>
              <div className="grid grid-cols-2 gap-3">
                {materials.map((material) => (
                  <label
                    key={material}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.material_specializations.includes(
                        material,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            material_specializations: [
                              ...formData.material_specializations,
                              material,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            material_specializations:
                              formData.material_specializations.filter(
                                (m) => m !== material,
                              ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {material.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (
                    !formData.fleet_trucks ||
                    !formData.fleet_capacity ||
                    formData.vehicle_types.length === 0
                  ) {
                    alert("Please fill in required fields");
                    return;
                  }
                  setStep(2);
                }}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Service Area */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Service Coverage</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Regions *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {regions.map((region) => (
                  <label
                    key={region}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.service_regions.includes(region)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            service_regions: [
                              ...formData.service_regions,
                              region,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            service_regions: formData.service_regions.filter(
                              (r) => r !== region,
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {region.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Distance (km)
              </label>
              <input
                type="number"
                value={formData.max_distance}
                onChange={(e) =>
                  setFormData({ ...formData, max_distance: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Optimization Priority
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["cost", "speed", "carbon", "balanced"] as const).map(
                  (priority) => (
                    <button
                      key={priority}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          optimization_priority: priority,
                        })
                      }
                      className={`p-3 border-2 rounded-lg text-center font-medium transition-all ${
                        formData.optimization_priority === priority
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (formData.service_regions.length === 0) {
                    alert("Please select at least one service region");
                    return;
                  }
                  setStep(3);
                }}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Pricing Structure</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Rate (/ton-km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, base_rate: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Load (tons)
                </label>
                <input
                  type="number"
                  value={formData.min_load}
                  onChange={(e) =>
                    setFormData({ ...formData, min_load: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consolidation Discount (%)
              </label>
              <input
                type="number"
                value={formData.consolidation_discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consolidation_discount: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                Discount offered when consolidating multiple shipments
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accepts_backhaul}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accepts_backhaul: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">
                  Accept backhaul opportunities (coordinate return trips)
                </span>
              </label>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="font-semibold text-orange-900 mb-2">
                 Your NexaPrime Agent is Ready!
              </h3>
              <p className="text-sm text-orange-800 mb-3">
                Your logistics agent will intelligently:
              </p>
              <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                <li>Monitor Nexus for transportation requests</li>
                <li>
                  Identify consolidation opportunities (many-to-one,
                  one-to-many)
                </li>
                <li>Optimize routes to reduce costs and carbon</li>
                <li>Coordinate with other logistics providers</li>
                <li>Propose efficient transportation deals</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : "Activate NexaPrime & Go to Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


