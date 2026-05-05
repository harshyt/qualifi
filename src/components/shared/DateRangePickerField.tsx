"use client";
import { useState } from "react";
import {
  Box,
  Popover,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Button,
} from "@mui/material";
import { CalendarDays, X, ChevronLeft, ChevronRight } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

interface DateRangePickerFieldProps {
  dateFrom: string | null;
  dateTo: string | null;
  onChange: (from: string | null, to: string | null) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MonthCalendar({
  month,
  from,
  to,
  hovered,
  onDayClick,
  onDayHover,
}: {
  month: Dayjs;
  from: Dayjs | null;
  to: Dayjs | null;
  hovered: Dayjs | null;
  onDayClick: (d: Dayjs) => void;
  onDayHover: (d: Dayjs | null) => void;
}) {
  const startOfMonth = month.startOf("month");
  const daysInMonth = month.daysInMonth();
  const firstDow = startOfMonth.day(); // 0=Sun

  // Range end for highlighting — use hovered if only `from` is set
  const rangeEnd = to ?? (from ? hovered : null);

  const cells: (Dayjs | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startOfMonth.add(i, "day")),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Box sx={{ width: 252, userSelect: "none" }}>
      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 36px)", mb: 0.5 }}>
        {DAYS.map((d) => (
          <Typography
            key={d}
            variant="caption"
            sx={{ textAlign: "center", color: "text.disabled", fontWeight: 600, fontSize: 11 }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Day cells */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 36px)" }}>
        {cells.map((day, i) => {
          if (!day) return <Box key={i} sx={{ height: 36 }} />;

          const isFrom = from && day.isSame(from, "day");
          const isTo = to && day.isSame(to, "day");
          const rangeFrom = from && rangeEnd && (from.isBefore(rangeEnd) ? from : rangeEnd);
          const rangeTo = from && rangeEnd && (from.isBefore(rangeEnd) ? rangeEnd : from);
          const inRange =
            rangeFrom && rangeTo && day.isAfter(rangeFrom, "day") && day.isBefore(rangeTo, "day");
          const isEndpoint = isFrom || isTo;
          const isStart = from && day.isSame(from, "day");
          const isEnd = (to ?? hovered) && day.isSame(to ?? hovered!, "day");

          return (
            <Box
              key={i}
              onClick={() => onDayClick(day)}
              onMouseEnter={() => onDayHover(day)}
              onMouseLeave={() => onDayHover(null)}
              sx={{
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                // range background strip
                bgcolor: inRange ? "#EEF2FF" : "transparent",
                borderRadius: isStart && !isEnd
                  ? "50% 0 0 50%"
                  : isEnd && !isStart
                    ? "0 50% 50% 0"
                    : isEndpoint && isStart && isEnd
                      ? "50%"
                      : "0",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isEndpoint ? "#3B5BDB" : "transparent",
                  color: isEndpoint ? "#fff" : "text.primary",
                  fontWeight: isEndpoint ? 700 : 400,
                  fontSize: 13,
                  "&:hover": {
                    bgcolor: isEndpoint ? "#3B5BDB" : "#EEF2FF",
                  },
                  zIndex: 1,
                }}
              >
                {day.date()}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function DateRangePickerField({
  dateFrom,
  dateTo,
  onChange,
}: DateRangePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<Dayjs | null>(null);
  const [leftMonth, setLeftMonth] = useState(() => dayjs().startOf("month"));
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const from = dateFrom ? dayjs(dateFrom) : null;
  const to = dateTo ? dayjs(dateTo) : null;
  const rightMonth = leftMonth.add(1, "month");

  const displayValue =
    from && to
      ? `${from.format("MMM D")} – ${to.format("MMM D, YYYY")}`
      : from
        ? `${from.format("MMM D, YYYY")} – ...`
        : "";

  const handleDayClick = (day: Dayjs) => {
    if (!from || (from && to)) {
      // Start new selection
      onChange(day.format("YYYY-MM-DD"), null);
    } else {
      // Complete the range
      if (day.isBefore(from, "day")) {
        onChange(day.format("YYYY-MM-DD"), from.format("YYYY-MM-DD"));
      } else {
        onChange(from.format("YYYY-MM-DD"), day.format("YYYY-MM-DD"));
      }
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  return (
    <>
      <Box ref={setAnchorEl}>
        <TextField
          size="small"
          value={displayValue}
          placeholder="Date range"
          onClick={() => setOpen(true)}
          inputProps={{ readOnly: true, style: { cursor: "pointer" } }}
          sx={{ width: 220 }}
          slotProps={{
            inputLabel: { shrink: false },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {displayValue ? (
                    <IconButton size="small" edge="end" onClick={handleClear}>
                      <X size={14} />
                    </IconButton>
                  ) : (
                    <CalendarDays size={16} style={{ color: "#6B7280" }} />
                  )}
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => { setOpen(false); setHovered(null); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: 2,
              border: "1px solid #E2E8F0",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              p: 2,
            },
          },
        }}
      >
        {/* Month navigation header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <IconButton size="small" onClick={() => setLeftMonth((m) => m.subtract(1, "month"))}>
            <ChevronLeft size={16} />
          </IconButton>
          <Box sx={{ display: "flex", gap: 8 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, width: 252, textAlign: "center" }}>
              {leftMonth.format("MMMM YYYY")}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, width: 252, textAlign: "center" }}>
              {rightMonth.format("MMMM YYYY")}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setLeftMonth((m) => m.add(1, "month"))}>
            <ChevronRight size={16} />
          </IconButton>
        </Box>

        {/* Two calendars */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <MonthCalendar
            month={leftMonth}
            from={from}
            to={to}
            hovered={hovered}
            onDayClick={handleDayClick}
            onDayHover={setHovered}
          />
          <Box sx={{ width: "1px", bgcolor: "#E2E8F0", mx: 1 }} />
          <MonthCalendar
            month={rightMonth}
            from={from}
            to={to}
            hovered={hovered}
            onDayClick={handleDayClick}
            onDayHover={setHovered}
          />
        </Box>

        {/* Footer hint */}
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.disabled">
            {!from ? "Click to select start date" : !to ? "Click to select end date" : ""}
          </Typography>
          {(from || to) && (
            <Button size="small" onClick={() => { onChange(null, null); }} sx={{ color: "text.secondary", fontSize: 12 }}>
              Clear
            </Button>
          )}
        </Box>
      </Popover>
    </>
  );
}
