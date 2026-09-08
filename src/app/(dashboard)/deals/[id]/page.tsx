export default async function DealDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Deal Details</h1>
      <p className="text-gray-600">Deal ID: {id}</p>
      <p className="text-sm text-gray-500">
        Detailed deal view is being expanded. Use Pending Deals for approval flow.
      </p>
    </div>
  );
}
