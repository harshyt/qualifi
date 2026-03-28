import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

function JobRowSkeleton() {
  return (
    <TableRow>
      <TableCell sx={{ width: "15%" }}>
        <Skeleton variant="text" width="80%" />
      </TableCell>
      <TableCell sx={{ width: "10%" }}>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Skeleton
            variant="rounded"
            width={60}
            height={24}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ width: "10%" }}>
        <Skeleton
          variant="rounded"
          width={70}
          height={24}
          sx={{ borderRadius: 2 }}
        />
      </TableCell>
      <TableCell sx={{ width: "55%" }}>
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="60%" />
      </TableCell>
      <TableCell sx={{ width: "10%" }} align="right">
        <Skeleton
          variant="circular"
          width={28}
          height={28}
          sx={{ ml: "auto" }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function JobsLoading() {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Skeleton variant="text" width={160} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton
          variant="rounded"
          width={140}
          height={36}
          sx={{ borderRadius: 2 }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={40}
          sx={{ borderRadius: 1, flexGrow: 1 }}
        />
        <Skeleton
          variant="rounded"
          width={200}
          height={40}
          sx={{ borderRadius: 1 }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#F9FAFB" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: "15%" }}>
                <Skeleton variant="text" width={70} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: "10%" }}>
                <Skeleton variant="text" width={50} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: "10%" }}>
                <Skeleton variant="text" width={50} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: "55%" }}>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: "10%" }} align="right">
                <Skeleton variant="text" width={50} sx={{ ml: "auto" }} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <JobRowSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
