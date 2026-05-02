"use client";
import { useCallback } from "react";
import { CloudUpload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AppButton from "@/components/ui/AppButton";
import SelectJobModal from "./SelectJobModal";
import { useActiveBatch } from "@/hooks/useActiveBatch";
import { useUploadBatch } from "@/hooks/useUploadBatch";
import { useState } from "react";

export default function UploadResume() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: activeBatchData } = useActiveBatch();
  const hasActiveBatch = !!activeBatchData?.batch;
  const { upload, isPending } = useUploadBatch();

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => setIsModalOpen(false), []);

  const handleJobSelect = useCallback(
    async (
      jobId: string,
      jobDescription: string,
      roleKey?: string,
      files?: File[],
      jobTitle?: string,
    ) => {
      setIsModalOpen(false);
      if (!files || files.length === 0) return;

      try {
        const result = await upload({
          jobId,
          jobDescription,
          jobTitle: jobTitle ?? "",
          roleKey,
          files,
        });

        if (result.failedUploads.length > 0) {
          const names = result.failedUploads.map((f) => f.name).join(", ");
          toast.error(`${result.failedUploads.length} file(s) could not be uploaded: ${names}`);
        }

        router.push(`/bulk-upload/${result.batchId}`);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          toast.error("Upload timed out. Please try again with fewer files.");
        } else {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        }
      }
    },
    [upload, router],
  );

  return (
    <>
      <AppButton
        variant="contained"
        startIcon={<CloudUpload size={18} />}
        onClick={handleOpenModal}
        disabled={isPending || isModalOpen || hasActiveBatch}
      >
        {hasActiveBatch ? "Upload in Progress" : "Upload Resume"}
      </AppButton>

      <SelectJobModal
        open={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleJobSelect}
      />
    </>
  );
}
