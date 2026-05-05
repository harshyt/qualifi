"use client";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Box,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

export interface ColumnDef<T> {
  id: string;
  label: string;
  width?: string | number;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  /** Optional leading column (e.g. checkbox) rendered before the defined columns */
  leadingCell?: ReactNode;
  /** Per-row leading cell renderer */
  leadingRowCell?: (row: T) => ReactNode;
  /** Per-row onClick */
  onRowClick?: (row: T) => void;
  /** Per-row sx override */
  rowSx?: (row: T) => object;
  /** Aria label for the table */
  ariaLabel?: string;
}

const HEADER_SX = {
  fontWeight: 600,
  color: "text.secondary",
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  emptyMessage = "No records found.",
  skeletonRows = 6,
  leadingCell,
  leadingRowCell,
  onRowClick,
  rowSx,
  ariaLabel,
}: DataTableProps<T>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "none", borderRadius: 0, flexGrow: 1, overflowY: "auto" }}
      >
        <Table sx={{ minWidth: 650 }} aria-label={ariaLabel}>
          <TableHead sx={{ bgcolor: "#F5F4F2" }}>
            <TableRow>
              {leadingCell !== undefined && (
                <TableCell padding="checkbox">{leadingCell}</TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  width={col.width}
                  sx={HEADER_SX}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <TableRow key={i}>
                    {leadingCell !== undefined && (
                      <TableCell padding="checkbox">
                        <Skeleton
                          variant="rectangular"
                          width={18}
                          height={18}
                          sx={{ borderRadius: 0.5 }}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: onRowClick ? "pointer" : "default",
                      "&:hover": onRowClick ? { bgcolor: "#F5F4F2" } : {},
                      transition: "background-color 0.15s ease",
                      ...(rowSx ? rowSx(row) : {}),
                    }}
                  >
                    {leadingRowCell && (
                      <TableCell padding="checkbox">
                        {leadingRowCell(row)}
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {!loading && rows.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body2">{emptyMessage}</Typography>
          </Box>
        )}
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => onPageChange(p)}
        onRowsPerPageChange={(e) =>
          onRowsPerPageChange(parseInt(e.target.value, 10))
        }
        rowsPerPageOptions={[10, 20, 50]}
        sx={{
          borderTop: "1px solid #E2E8F0",
          ".MuiTablePagination-toolbar": { minHeight: 48 },
        }}
      />
    </Box>
  );
}
