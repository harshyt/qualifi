import ResultsPage from "@/components/BulkUpload/ResultsPage";

export default async function BulkUploadResultsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  return <ResultsPage batchId={batchId} />;
}
