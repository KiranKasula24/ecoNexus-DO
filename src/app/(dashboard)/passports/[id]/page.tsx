import { PassportCard } from "@/components/passport/passportCard";

export default async function PassportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  //  Must await params in Next 16
  const { id } = await params;

  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <PassportCard passportId={id} />
    </div>
  );
}

