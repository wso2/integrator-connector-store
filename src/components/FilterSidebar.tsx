'use client';

import React from 'react';
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
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { FilterOptions } from '@/types/connector';

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  selectedAreas: string[];
  selectedVendors: string[];
  selectedTypes: string[];
  onAreaChange: (area: string) => void;
  onVendorChange: (vendor: string) => void;
  onTypeChange: (type: string) => void;
  onClearAll: () => void;
}

export default function FilterSidebar({
  filterOptions,
  selectedAreas,
  selectedVendors,
  selectedTypes,
  onAreaChange,
  onVendorChange,
  onTypeChange,
  onClearAll,
}: FilterSidebarProps) {
  const totalFiltersActive = selectedAreas.length + selectedVendors.length + selectedTypes.length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        position: 'sticky',
        top: 24,
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        {totalFiltersActive > 0 && (
          <Chip
            label={`${totalFiltersActive} active`}
            size="small"
            color="primary"
            onDelete={onClearAll}
          />
        )}
      </Box>

      {/* Area Filter */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 48 }}>
          <Typography sx={{ fontWeight: 500 }}>
            Area {selectedAreas.length > 0 && `(${selectedAreas.length})`}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
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
      </Accordion>

      {/* Vendor Filter */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 48 }}>
          <Typography sx={{ fontWeight: 500 }}>
            Vendor {selectedVendors.length > 0 && `(${selectedVendors.length})`}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
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
      </Accordion>

      {/* Type Filter */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 48 }}>
          <Typography sx={{ fontWeight: 500 }}>
            Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <FormGroup>
            {filterOptions.types.map((type) => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    checked={selectedTypes.includes(type)}
                    onChange={() => onTypeChange(type)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{type}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
