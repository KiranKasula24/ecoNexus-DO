import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: passportId } = await context.params;

  if (!passportId) {
    return NextResponse.json({ error: "Invalid passport ID" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();

    //  Get authenticated user

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("document_type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1 Verify passport exists
    const { data: passport, error: passportError } = await supabase
      .from("material_passports")
      .select("id")
      .eq("id", passportId)
      .single();

    if (passportError || !passport) {
      return NextResponse.json(
        { error: "Passport not found" },
        { status: 404 },
      );
    }

    // 2 Upload file to storage
    const fileName = `${passportId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("passport-documents")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    // 3 Get public URL
    const { data: urlData } = supabase.storage
      .from("passport-documents")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // 4 Insert document record
    const { data: document, error: documentError } = await supabase
      .from("passport_documents")
      .insert({
        passport_id: passportId,
        document_type: documentType || "certification",
        file_url: fileUrl,
        uploaded_by: null,
        verification_status: "pending",
      })
      .select()
      .single();

    if (documentError) {
      console.error("Insert error:", documentError);
      throw new Error(documentError.message);
    }

    // 5 Create event
    await supabase.from("passport_events").insert({
      passport_id: passportId,
      event_type: "document_uploaded",
      description: `Document uploaded: ${documentType}`,
      metadata: {
        document_id: document.id,
        document_type: documentType,
        file_name: file.name,
      },
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: error.message || "Document upload failed" },
      { status: 500 },
    );
  }
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: passportId } = await context.params;

  if (!passportId || passportId === "undefined") {
    return NextResponse.json({ error: "Invalid passport ID" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data: documents, error } = await supabase
      .from("passport_documents")
      .select("*")
      .eq("passport_id", passportId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      passport_id: passportId,
      documents: documents || [],
    });
  } catch (error: any) {
    console.error("Document fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

