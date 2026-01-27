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

import { memo, useMemo } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Divider,
} from '@wso2/oxygen-ui';
import { Download, Clock } from '@wso2/oxygen-ui-icons-react';
import { BallerinaPackage } from '@/types/connector';
import { parseConnectorMetadata } from '@/lib/connector-utils';

const WSO2_ORANGE = '#FF7300';

interface ConnectorCardProps {
  connector: BallerinaPackage;
  effectiveMode: 'light' | 'dark';
}

/**
 * Format pull count to human-readable format
 */
function formatPullCount(count: number | undefined): string {
  if (!count) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Format date to relative time
 */
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } catch {
    return dateString;
  }
}

/**
 * Get icon letter from connector name
 */
function getIconLetter(name: string): string {
  const parts = name.split('.');
  return parts[parts.length - 1]?.charAt(0).toUpperCase() || 'C';
}

/**
 * Get icon background color based on name
 */
function getIconColor(name: string): string {
  const colors = ['#DC2626', '#2563EB', '#16A34A', '#9333EA', '#EA580C', '#52525B'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function ConnectorCard({ connector, effectiveMode }: ConnectorCardProps) {
  // Memoize expensive computations
  const metadata = useMemo(() => parseConnectorMetadata(connector.keywords), [connector.keywords]);
  const iconLetter = useMemo(() => getIconLetter(connector.name), [connector.name]);
  const iconColor = useMemo(() => getIconColor(connector.name), [connector.name]);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: effectiveMode === 'dark' ? '#18181B' : '#FFFFFF',
        border: effectiveMode === 'dark' ? 'none' : '1px solid #E5E7EB',
        boxShadow: effectiveMode === 'dark' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      }}
    >
      <CardActionArea
        href={`https://central.ballerina.io/${connector.URL}`}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ flexGrow: 1, width: '100%', p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'white',
              fontSize: 18,
              flexShrink: 0,
              bgcolor: connector.icon ? 'transparent' : iconColor,
              overflow: 'hidden',
            }}
          >
            {connector.icon ? (
              <img 
                src={connector.icon} 
                alt={connector.name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
              />
            ) : (
              iconLetter
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {connector.name.split('.').pop() || connector.name}
              </Typography>
              <Chip
                label={connector.version}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.75,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {connector.summary}
            </Typography>
          </Box>
        </Box>

        {/* Tags */}
        <Box display="flex" gap={1} flexWrap="wrap" mb={2} mt={2}>
          {/* Type chip - always visible */}
          <Chip
            label={metadata.type}
            size="small"
            color="primary"
            sx={{
              fontSize: '0.7rem',
              height: '24px',
              '& .MuiChip-label': {
                textTransform: 'none',
              }
            }}
          />

          {metadata.vendor !== 'Other' && (
            <Chip
              label={metadata.vendor}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: '24px',
                '& .MuiChip-label': {
                  textTransform: 'none',
                }
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
                '& .MuiChip-label': {
                  textTransform: 'none',
                }
              }}
            />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Download size={14} />{' '}
              {formatPullCount(connector.totalPullCount)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Clock size={14} />{' '}
              {formatRelativeTime(connector.createdDate)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
      </CardActionArea>
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(ConnectorCard);
