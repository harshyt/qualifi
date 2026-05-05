"use client";
import { Box, Typography, Divider, Grid, Paper, Skeleton } from "@mui/material";
import { Users, FileText, Briefcase } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";

interface StatCardProps {
  label: string;
  sublabel: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}

function StatCard({
  label,
  sublabel,
  value,
  icon,
  color,
  loading,
}: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid #E2E8F0",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 0.5,
        }}
      >
        {icon}
      </Box>

      {loading ? (
        <Skeleton variant="text" width={60} height={40} />
      ) : (
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1 }}
        >
          {value}
        </Typography>
      )}

      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {sublabel}
      </Typography>
    </Paper>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const loading = statsLoading;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: "text.primary",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Overview and insights
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Active Users"
            sublabel="Total registered"
            value={stats?.totalUsers ?? 0}
            icon={<Users size={20} color="#2196F3" />}
            color="#2196F3"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Resumes Parsed"
            sublabel="Total"
            value={stats?.totalCandidates ?? 0}
            icon={<FileText size={20} color="#7C3AED" />}
            color="#7C3AED"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="JDs Created"
            sublabel="Total"
            value={stats?.totalJobs ?? 0}
            icon={<Briefcase size={20} color="#059669" />}
            color="#059669"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Monthly activity chart */}
      <Paper
        elevation={0}
        sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 2, flexGrow: 1 }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "text.primary", mb: 3 }}
        >
          Monthly Activity — Last 6 Months
        </Typography>

        {statsLoading ? (
          <Skeleton variant="rectangular" width="100%" height={260} sx={{ borderRadius: 1 }} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={stats?.monthlyCounts ?? []}
              margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
              barCategoryGap="35%"
              barGap={4}
            >
              <CartesianGrid vertical={false} stroke="#F0EDE8" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
                cursor={{ fill: "#F5F4F2" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              />
              <Bar
                dataKey="candidates"
                name="Resumes Parsed"
                fill="#2196F3"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="jobs"
                name="JDs Created"
                fill="#059669"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  );
}
