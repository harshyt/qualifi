import { Box, Grid, Paper, Skeleton, Divider } from "@mui/material";

export default function CandidateDetailLoading() {
  return (
    <Box
      sx={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton
            variant="rounded"
            width={80}
            height={32}
            sx={{ borderRadius: 1 }}
          />
          <Box>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={280} height={20} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Skeleton
            variant="rounded"
            width={90}
            height={36}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rounded"
            width={100}
            height={36}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Box>

      {/* Two-column layout */}
      <Grid container spacing={3} sx={{ flexGrow: 1, overflow: "hidden" }}>
        {/* Resume Details */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          <Paper sx={{ height: "100%", p: 3, border: "1px solid #E0E0E0" }}>
            <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />

            {/* Technologies */}
            <Skeleton variant="text" width={100} height={18} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={80} height={14} sx={{ mb: 0.5 }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={70 + i * 10}
                  height={24}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>

            {/* Skills */}
            <Skeleton variant="text" width={60} height={18} sx={{ mb: 1 }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={60 + i * 8}
                  height={24}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>

            {/* Experience */}
            <Skeleton variant="text" width={90} height={18} sx={{ mb: 1 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Box
                key={i}
                sx={{ mb: 2, pl: 2, borderLeft: "2px solid #ECEFF1" }}
              >
                <Skeleton variant="text" width="60%" height={22} />
                <Skeleton variant="text" width="40%" height={18} />
                <Skeleton variant="text" width="90%" height={16} />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* AI Analysis */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          <Paper sx={{ height: "100%", p: 3, border: "1px solid #E0E0E0" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Skeleton variant="text" width={110} height={28} />
              <Skeleton
                variant="rounded"
                width={100}
                height={28}
                sx={{ borderRadius: 2 }}
              />
            </Box>

            {/* Summary */}
            <Skeleton variant="text" width={130} height={16} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={18} />
            <Skeleton variant="text" width="85%" height={18} />
            <Skeleton variant="text" width="70%" height={18} sx={{ mb: 3 }} />

            <Divider sx={{ my: 3 }} />

            {/* Strengths */}
            <Skeleton variant="text" width={110} height={16} sx={{ mb: 1 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                width={`${85 - i * 5}%`}
                height={18}
                sx={{ mb: 1 }}
              />
            ))}

            {/* Gaps */}
            <Skeleton
              variant="text"
              width={100}
              height={16}
              sx={{ mt: 3, mb: 1 }}
            />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                width={`${80 - i * 10}%`}
                height={18}
                sx={{ mb: 1 }}
              />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
