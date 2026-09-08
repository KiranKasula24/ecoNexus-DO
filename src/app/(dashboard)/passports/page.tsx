"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";

type PassportListItem = {
  id: string;
  material_category: string;
  material_subtype: string;
  volume: number;
  unit: string;
  verification_status: string | null;
  created_at: string | null;
};

export default function PassportsPage() {
  const { company } = useAuth();
  const [items, setItems] = useState<PassportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!company?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("material_passports")
          .select(
            "id, material_category, material_subtype, volume, unit, verification_status, created_at, current_owner_company_id",
          )
          .eq("current_owner_company_id", company.id)
          .order("created_at", { ascending: false });

        if (queryError) {
          throw new Error(queryError.message);
        }

        setItems((data || []) as PassportListItem[]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load passports.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [company?.id]);

  if (loading) {
    return <div className="p-6">Loading passports...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Material Passports</h1>
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 rounded text-red-700">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <div className="p-6 border rounded-lg bg-white">
          <p className="text-gray-600">No passports yet.</p>
          <Link
            href="/materials/flow/create"
            className="text-blue-600 hover:underline"
          >
            Create waste-stream passport
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/passports/${item.id}`}
              className="p-4 border rounded-lg bg-white hover:border-blue-300"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold capitalize">
                    {item.material_category} - {item.material_subtype}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.volume} {item.unit}
                  </p>
                </div>
                <span className="text-sm capitalize text-gray-700">
                  {item.verification_status || "unverified"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

