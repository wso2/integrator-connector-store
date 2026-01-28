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
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('should render with default placeholder', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} effectiveMode="light" />);

    expect(screen.getByPlaceholderText('Search connectors...')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} placeholder="Custom placeholder" effectiveMode="light" />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should display the provided value', () => {
    const onChange = jest.fn();
    render(<SearchBar value="test query" onChange={onChange} effectiveMode="light" />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar value="" onChange={onChange} effectiveMode="light" />);

    const input = screen.getByPlaceholderText('Search connectors...');
    await user.type(input, 'stripe');

    // onChange should be called for each character typed
    expect(onChange).toHaveBeenCalledTimes(6);
    expect(onChange).toHaveBeenLastCalledWith('e');
  });

  it('should call onChange with full value on change event', () => {
    const onChange = jest.fn();

    render(<SearchBar value="" onChange={onChange} effectiveMode="light" />);

    const input = screen.getByPlaceholderText('Search connectors...');
    fireEvent.change(input, { target: { value: 'payment' } });

    expect(onChange).toHaveBeenCalledWith('payment');
  });

  it('should render search icon', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} effectiveMode="light" />);

    // MUI renders the icon with a data-testid or we can check for svg
    const searchIcon = document.querySelector('[data-testid="SearchIcon"]');
    expect(searchIcon).toBeInTheDocument();
  });
});
