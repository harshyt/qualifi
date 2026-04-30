import ProcessingPage from "@/components/BulkUpload/ProcessingPage";

export default async function BulkUploadPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  return <ProcessingPage batchId={batchId} />;
}
