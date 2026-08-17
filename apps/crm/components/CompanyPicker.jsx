'use client';

import { Building2 } from 'lucide-react';
import { Select } from '@webfudge/ui';
import { useCompanyPicker } from '../lib/companyPicker';

/**
 * Searchable lead-company / client-account select that queries the API
 * instead of loading a truncated first page.
 */
export default function CompanyPicker({
  type = 'leadCompany',
  value,
  onChange,
  excludeConverted = true,
  hydrateOnSelect = false,
  label,
  placeholder = 'Select company',
  disabled = false,
  error,
  icon = Building2,
  allowEmpty = true,
  searchPlaceholder = 'Search companies…',
  required = false,
}) {
  const picker = useCompanyPicker({
    type,
    value,
    excludeConverted: type === 'leadCompany' ? excludeConverted : false,
    enabled: !disabled,
  });

  const handleChange = async (next) => {
    const id = next ? String(next) : '';
    if (!id) {
      onChange?.('', null);
      return;
    }
    let item = picker.getItem(id);
    if (!item || hydrateOnSelect) {
      item = (await picker.resolveItem(id, { force: hydrateOnSelect })) || item || null;
    }
    onChange?.(id, item);
  };

  return (
    <Select
      label={label}
      value={value || ''}
      onChange={handleChange}
      options={picker.options}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      icon={icon}
      allowEmpty={allowEmpty}
      required={required}
      searchable
      asyncSearch
      searchPlaceholder={searchPlaceholder}
      onSearch={picker.onSearch}
      loading={picker.loading}
      hasMore={picker.hasMore}
      onLoadMore={picker.onLoadMore}
      selectedLabel={picker.selectedLabel}
    />
  );
}
