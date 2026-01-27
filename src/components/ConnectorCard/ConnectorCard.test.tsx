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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConnectorCard from './ConnectorCard';
import { BallerinaPackage } from '@/types/connector';

// Helper to create mock connector
const createMockConnector = (overrides: Partial<BallerinaPackage> = {}): BallerinaPackage => ({
  name: 'stripe',
  version: '1.0.0',
  URL: 'packages/ballerinax/stripe/1.0.0',
  summary: 'A connector for Stripe payment processing',
  keywords: ['Area/Finance', 'Vendor/Stripe', 'Type/Connector'],
  icon: 'https://example.com/stripe-icon.png',
  createdDate: new Date().toISOString(),
  totalPullCount: 15000,
  ...overrides,
});

describe('ConnectorCard', () => {
  it('should render connector name correctly', () => {
    const connector = createMockConnector({ name: 'github' });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('github')).toBeInTheDocument();
  });

  it('should render connector version', () => {
    const connector = createMockConnector({ version: '2.5.1' });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('2.5.1')).toBeInTheDocument();
  });

  it('should render connector summary', () => {
    const connector = createMockConnector({ summary: 'Test summary description' });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('Test summary description')).toBeInTheDocument();
  });

  it('should render type chip', () => {
    const connector = createMockConnector({
      keywords: ['Area/Finance', 'Vendor/Stripe', 'Type/API'],
    });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('should render vendor chip when not "Other"', () => {
    const connector = createMockConnector({
      keywords: ['Area/Finance', 'Vendor/Stripe', 'Type/Connector'],
    });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });

  it('should not render vendor chip when "Other"', () => {
    const connector = createMockConnector({
      keywords: ['Area/Finance', 'Vendor/Other', 'Type/Connector'],
    });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('Connector')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('should render area chip when not "Other"', () => {
    const connector = createMockConnector({
      keywords: ['Area/Communication', 'Vendor/Twilio', 'Type/Connector'],
    });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('should format pull count correctly', () => {
    const connector = createMockConnector({ totalPullCount: 1500000 });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('1.5M')).toBeInTheDocument();
  });

  it('should show "0" when pullCount is undefined', () => {
    const connector = createMockConnector({ totalPullCount: undefined });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render formatted relative date', () => {
    // Set date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const connector = createMockConnector({ createdDate: yesterday.toISOString() });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('1 day ago')).toBeInTheDocument();
  });

  it('should have a link to connector URL', () => {
    const connector = createMockConnector({ URL: 'packages/ballerinax/test/1.0.0' });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    const link = screen.getByRole('link', { name: /view/i });
    expect(link).toHaveAttribute('href', 'packages/ballerinax/test/1.0.0');
  });

  it('should open link in new tab', () => {
    const connector = createMockConnector();
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    const link = screen.getByRole('link', { name: /view/i });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should render avatar with first letter fallback', () => {
    const connector = createMockConnector({ name: 'testconnector', icon: '' });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should handle dot-separated names correctly', () => {
    const connector = createMockConnector({ name: 'aws.s3' });
    render(<ConnectorCard connector={connector} effectiveMode="light" />);

    expect(screen.getByText('s3')).toBeInTheDocument();
  });
});
