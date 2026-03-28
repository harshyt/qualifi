import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

function StatCardSkeleton() {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={40} />
    </Paper>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell padding="checkbox">
        <Skeleton
          variant="rectangular"
          width={20}
          height={20}
          sx={{ borderRadius: 0.5 }}
        />
      </TableCell>
      <TableCell>
        <Skeleton variant="text" width="70%" />
      </TableCell>
      <TableCell>
        <Skeleton variant="text" width="50%" />
      </TableCell>
      <TableCell>
        <Skeleton variant="circular" width={40} height={40} />
      </TableCell>
      <TableCell>
        <Skeleton
          variant="rounded"
          width={80}
          height={24}
          sx={{ borderRadius: 2 }}
        />
      </TableCell>
      <TableCell>
        <Skeleton variant="text" width="60%" />
      </TableCell>
    </TableRow>
  );
}

export default function DashboardLoading() {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box>
          <Skeleton variant="text" width={180} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton
          variant="rounded"
          width={140}
          height={36}
          sx={{ borderRadius: 2 }}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 1 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 0 }}>
        <Skeleton variant="text" width={400} height={48} />
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "0 0 8px 8px",
          border: "1px solid #E0E0E0",
          borderTop: 0,
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#F9FAFB" }}>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>
                <Skeleton variant="text" width={60} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={40} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={50} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={50} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={40} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
