
import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { FilterOptions } from '@/types/connector';

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  selectedAreas: string[];
  selectedVendors: string[];
  onAreaChange: (area: string) => void;
  onVendorChange: (vendor: string) => void;
  onClearAll: () => void;
}

export default function FilterSidebar({
  filterOptions,
  selectedAreas,
  selectedVendors,
  onAreaChange,
  onVendorChange,
  onClearAll,
}: FilterSidebarProps) {
  const totalFiltersActive = selectedAreas.length + selectedVendors.length;
  const areaScrollRef = useRef<HTMLDivElement>(null);
  const vendorScrollRef = useRef<HTMLDivElement>(null);
  const [showAreaScroll, setShowAreaScroll] = useState(false);
  const [showVendorScroll, setShowVendorScroll] = useState(false);

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = (ref: React.RefObject<HTMLDivElement | null>, setter: (value: boolean) => void) => {
      if (ref.current) {
        const { scrollHeight, clientHeight } = ref.current;
        setter(scrollHeight > clientHeight);
      }
    };

    checkScrollable(areaScrollRef, setShowAreaScroll);
    checkScrollable(vendorScrollRef, setShowVendorScroll);
  }, [filterOptions]);

  return (
    <Box sx={{ position: 'sticky', top: 24 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        {totalFiltersActive > 0 && (
          <Chip
            label={totalFiltersActive.toString()}
            size="small"
            color="primary"
            onDelete={onClearAll}
            deleteIcon={<Box component="span" sx={{ fontSize: '0.75rem', ml: 0.5 }}>✕</Box>}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Area Filter */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Accordion
          defaultExpanded
          disableGutters
          elevation={0}
          sx={{
            '&:before': {
              display: 'none',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              px: 2,
              minHeight: 48,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              Area {selectedAreas.length > 0 && `(${selectedAreas.length})`}
            </Typography>
          </AccordionSummary>
          <Box sx={{ position: 'relative' }}>
            <AccordionDetails
              ref={areaScrollRef}
              sx={{
                px: 2,
                pt: 1,
                pb: 2,
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              <FormGroup>
                {filterOptions.areas.map((area) => (
                  <FormControlLabel
                    key={area}
                    control={
                      <Checkbox
                        checked={selectedAreas.includes(area)}
                        onChange={() => onAreaChange(area)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">{area}</Typography>}
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
            {showAreaScroll && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40px',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(to bottom, transparent, rgba(26, 26, 26, 0.9))'
                      : 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.9))',
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
        </Accordion>
      </Paper>

      {/* Vendor Filter */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Accordion
          defaultExpanded
          disableGutters
          elevation={0}
          sx={{
            '&:before': {
              display: 'none',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              px: 2,
              minHeight: 48,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              Vendor {selectedVendors.length > 0 && `(${selectedVendors.length})`}
            </Typography>
          </AccordionSummary>
          <Box sx={{ position: 'relative' }}>
            <AccordionDetails
              ref={vendorScrollRef}
              sx={{
                px: 2,
                pt: 1,
                pb: 2,
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              <FormGroup>
                {filterOptions.vendors.map((vendor) => (
                  <FormControlLabel
                    key={vendor}
                    control={
                      <Checkbox
                        checked={selectedVendors.includes(vendor)}
                        onChange={() => onVendorChange(vendor)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">{vendor}</Typography>}
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
            {showVendorScroll && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40px',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(to bottom, transparent, rgba(26, 26, 26, 0.9))'
                      : 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.9))',
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
        </Accordion>
      </Paper>
    </Box>
  );
}
