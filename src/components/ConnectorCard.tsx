'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Avatar,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { BallerinaPackage } from '@/types/connector';
import { parseConnectorMetadata, formatPullCount } from '@/lib/connector-utils';

interface ConnectorCardProps {
  connector: BallerinaPackage;
}

export default function ConnectorCard({ connector }: ConnectorCardProps) {
  const metadata = parseConnectorMetadata(connector.keywords);

  // Extract org from URL or default to ballerinax
  // URL format: https://central.ballerina.io/ballerinax/package_name/version
  const urlParts = connector.URL.split('/');
  const org = urlParts[3] || 'ballerinax';
  const centralUrl = `https://central.ballerina.io/${org}/${connector.name}`;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea
        href={centralUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
          {/* Icon and Title */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar
              src={connector.icon}
              alt={connector.name}
              sx={{ width: 48, height: 48 }}
              variant="rounded"
            >
              {connector.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {connector.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v{connector.version}
              </Typography>
            </Box>
          </Box>

          {/* Summary */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '40px',
            }}
          >
            {connector.summary}
          </Typography>

          {/* Metadata Chips */}
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {metadata.vendor !== 'Other' && (
              <Chip
                label={metadata.vendor}
                size="small"
                sx={{ fontSize: '0.7rem', height: '24px' }}
              />
            )}
            {metadata.area !== 'Other' && (
              <Chip
                label={metadata.area}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '24px' }}
              />
            )}
            {metadata.type !== 'Other' && (
              <Chip
                label={metadata.type}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '24px' }}
              />
            )}
          </Box>

          {/* Pull Count */}
          <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
            <DownloadIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="caption">
              {formatPullCount(connector.pullCount)} downloads
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
