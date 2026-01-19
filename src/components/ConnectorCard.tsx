/*
 Copyright (c) 2026 WSO2 LLC. (http://www.wso2.com) All Rights Reserved.

 WSO2 LLC. licenses this file to you under the Apache License,
 Version 2.0 (the "License"); you may not use this file except
 in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

import { memo, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Avatar,
  Button,
} from '@mui/material';
import { Download as DownloadIcon, AccessTime as ClockIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { BallerinaPackage } from '@/types/connector';
import {
  parseConnectorMetadata,
  formatPullCount,
  formatDate,
  formatDaysSince,
  getDisplayName,
} from '@/lib/connector-utils';

interface ConnectorCardProps {
  connector: BallerinaPackage;
}

function ConnectorCard({ connector }: ConnectorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize expensive computations
  const metadata = useMemo(() => parseConnectorMetadata(connector.keywords), [connector.keywords]);

  const displayName = useMemo(
    () => getDisplayName(connector.name, metadata.vendor),
    [connector.name, metadata.vendor]
  );

  const centralUrl = useMemo(
    () => `https://central.ballerina.io/${connector.URL}`,
    [connector.URL]
  );

  // Check if summary is long enough to need truncation
  const needsTruncation = connector.summary.length > 120;
  const summaryId = `connector-summary-${connector.name}`;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardActionArea
          href={centralUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
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
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 600, fontSize: '1.1rem' }}
                >
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  v{connector.version}
                </Typography>
              </Box>
            </Box>

            {/* Summary */}
            <Box
              id={summaryId}
              sx={{
                mb: 2,
                minHeight: '40px',
                '& p': {
                  margin: 0,
                  fontSize: '0.8125rem',
                  lineHeight: 1.43,
                  color: 'text.secondary',
                },
                '& code': {
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontSize: '0.8125rem',
                  fontFamily: 'monospace',
                },
                '& strong': {
                  fontWeight: 600,
                },
                '& em': {
                  fontStyle: 'italic',
                },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
                ...(!isExpanded &&
                  needsTruncation && {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }),
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <span>{children}</span>,
                  a: ({ children }) => <span>{children}</span>,
                }}
              >
                {connector.summary}
              </ReactMarkdown>
            </Box>

            {/* Metadata Chips and other content */}
            <Box flexGrow={1} />
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip
                label={metadata.type}
                size="small"
                color="primary"
                sx={{
                  fontSize: '0.7rem',
                  height: '24px',
                  '& .MuiChip-label': { textTransform: 'none' },
                }}
              />
              {metadata.vendor !== 'Other' && (
                <Chip
                  label={metadata.vendor}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    height: '24px',
                    '& .MuiChip-label': { textTransform: 'none' },
                  }}
                />
              )}
              {metadata.area !== 'Other' && (
                <Chip
                  label={metadata.area}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: '24px',
                    '& .MuiChip-label': { textTransform: 'none' },
                  }}
                />
              )}
            </Box>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                <DownloadIcon sx={{ fontSize: '1rem' }} />
                <Typography variant="caption">
                  {connector.totalPullCount != null
                    ? `${formatPullCount(connector.totalPullCount)} downloads`
                    : 'Loading downloads...'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                <ClockIcon sx={{ fontSize: '1rem' }} />
                <Typography variant="caption" title={formatDate(connector.createdDate)}>
                  {formatDaysSince(connector.createdDate)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Box>
      {needsTruncation && (
        <Box sx={{ p: 2, pt: 0, alignSelf: 'flex-start' }}>
          <Button
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={summaryId}
            sx={{
              minWidth: 'auto',
              padding: 0,
              fontSize: '0.75rem',
              textTransform: 'none',
              mt: -1.5,
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        </Box>
      )}
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(ConnectorCard);
