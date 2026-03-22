"use client";
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import dynamic from "next/dynamic";
import { createJob } from "@/actions/jobs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROLE_CONFIGS } from "@/constants/roles";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

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
}

export default function AddJobForm({ onSuccess }: AddJobFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [roleKey, setRoleKey] = useState<string>("generic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleClientChange = (
    event: SelectChangeEvent<typeof selectedClients>,
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedClients(typeof value === "string" ? value.split(",") : value);
  };

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
    formData.append("clients", JSON.stringify(selectedClients));
    formData.append("roleKey", roleKey);

    try {
      const result = await createJob(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Job added successfully");
        setTitle("");
        setDescription("");
        setSelectedClients([]);
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
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Job Title"
        variant="outlined"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        sx={{ mb: 3 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="client-multiple-select-label">Clients</InputLabel>
        <Select
          labelId="client-multiple-select-label"
          id="client-multiple-select"
          multiple
          value={selectedClients}
          onChange={handleClientChange}
          input={<OutlinedInput id="select-multiple-chip" label="Clients" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {CLIENTS.map((client) => (
            <MenuItem key={client} value={client}>
              {client}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="role-select-label">Job Role Profile</InputLabel>
        <Select
          labelId="role-select-label"
          id="role-select"
          value={roleKey}
          label="Job Role Profile"
          onChange={(e) => setRoleKey(e.target.value)}
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
        </Select>
      </FormControl>

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

      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{
          bgcolor: "#2196F3",
          color: "white",
          "&:hover": { bgcolor: "#1976D2" },
          px: 4,
          py: 1,
          mt: 2,
        }}
      >
        {isSubmitting ? "Saving..." : "Save Job"}
      </Button>
    </Box>
  );
}
