import { NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  try {
    const formData = await req.formData();

    const company_id = formData.get("company_id") as string;
    const file = formData.get("file") as File;

    if (!company_id || !file) {
      return NextResponse.json(
        { error: "company_id and file are required." },
        { status: 400 },
      );
    }

    // 1 Upload file to Supabase Storage
    const filePath = `company-${company_id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, file, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError }, { status: 500 });
    }

    // 2 Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("invoices")
      .getPublicUrl(filePath);

    const file_url = publicUrlData.publicUrl;

    // 3 Insert invoice metadata into DB
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        company_id,
        file_url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        status: "uploaded",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ invoice: data }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}

