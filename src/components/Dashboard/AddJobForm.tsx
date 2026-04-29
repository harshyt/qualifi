"use client";
import React, { useState, useEffect } from "react";
import { Box, Button, MenuItem, Typography } from "@mui/material";
import AppTextField from "@/components/ui/AppTextField";
import AppSelect from "@/components/ui/AppSelect";
import dynamic from "next/dynamic";
import { createJob, updateJob } from "@/actions/jobs";
import type { Job } from "@/hooks/useJobs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROLE_CONFIGS } from "@/constants/roles";

const ReactQuill = dynamic(() => import("./QuillEditor"), { ssr: false });

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const CLIENTS = ["StoneX"];

/** Strips HTML tags and checks if the remaining text content is empty. */
function isEmptyRichText(html: string): boolean {
  if (!html) return true;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim() === "";
}

interface AddJobFormProps {
  onSuccess?: () => void;
  initialData?: Job;
}

export default function AddJobForm({
  onSuccess,
  initialData,
}: AddJobFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [roleKey, setRoleKey] = useState<string>("generic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setSelectedClient(initialData.client?.[0] ?? "");
      setRoleKey(initialData.tags?.[0] ?? "generic");
    } else {
      setTitle("");
      setDescription("");
      setSelectedClient("");
      setRoleKey("generic");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isEmptyRichText(description)) {
      toast.error("Please fill in the Job Title and Description.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append(
      "clients",
      JSON.stringify(selectedClient ? [selectedClient] : []),
    );
    formData.append("roleKey", roleKey);

    try {
      const result = initialData
        ? await updateJob(initialData.id, formData)
        : await createJob(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          initialData ? "Job updated successfully" : "Job added successfully",
        );
        if (!initialData) {
          setTitle("");
          setDescription("");
          setSelectedClient("");
          setRoleKey("generic");
        }
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } catch {
      toast.error("Failed to add job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
        <AppTextField
          label="Job Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 3 }}
        />

        <AppSelect
          label="Client"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value as string)}
          MenuProps={MenuProps}
          formControlSx={{ mb: 3 }}
        >
          {CLIENTS.map((client) => (
            <MenuItem key={client} value={client}>
              {client}
            </MenuItem>
          ))}
        </AppSelect>

        <AppSelect
          label="Job Role Profile"
          value={roleKey}
          onChange={(e) => setRoleKey(e.target.value as string)}
          formControlSx={{ mb: 3 }}
        >
          {Object.entries(ROLE_CONFIGS).map(([key, config]) => (
            <MenuItem key={key} value={key} sx={{ py: 1.5 }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {config.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {config.persona}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </AppSelect>

        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
          Job Description
        </Typography>
        <Box sx={{ mb: 3, ".ql-container": { minHeight: "200px" } }}>
          <ReactQuill
            theme="snow"
            value={description}
            onChange={setDescription}
            style={{ height: "250px", marginBottom: "40px" }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          p: { xs: 2, sm: 3 },
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ px: 4, py: 1, width: "100%" }}
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Job" : "Save Job"}
        </Button>
      </Box>
    </Box>
  );
}
