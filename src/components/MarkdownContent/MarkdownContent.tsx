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

import { Box } from '@wso2/oxygen-ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {

  return (
    <Box
      sx={{
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          mt: 2,
          mb: 1.5,
          fontWeight: 600,
          '&:first-of-type': { mt: 0 },
        },
        '& h2': { fontSize: '1.5rem' },
        '& h3': { fontSize: '1.25rem' },
        '& p': { my: 1.5, lineHeight: 1.7 },
        '& ul, & ol': { my: 1.5, pl: 3 },
        '& li': { my: 0.5 },
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 1,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
