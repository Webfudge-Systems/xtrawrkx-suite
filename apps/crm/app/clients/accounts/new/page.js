'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Modal,
  FormSectionCard,
  Badge,
  useIndustrySelectOptions,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import clientAccountService from '../../../../lib/api/clientAccountService';
import contactService from '../../../../lib/api/contactService';
import { contactFieldsFromClientAccount } from '@webfudge/utils';
import strapiClient from '../../../../lib/strapiClient';
import { canWriteCRM } from '../../../../lib/rbac';
import { useAuth } from '@webfudge/auth';
import {
  companyTypes,
  INDUSTRY_OTHER_VALUE,
  resolveIndustryForSave,
} from '@webfudge/utils';
import { fetchStoredIndustriesForCrm } from '../../../../lib/industryOptionsLoader';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Layers,
  TrendingUp,
  DollarSign,
  Calendar,
  Linkedin,
  AtSign,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  MapPinned,
  Briefcase,
  FileText,
  Users,
  User,
  Plus,
  Trash2,
} from 'lucide-react';

const employeeSizeOptions = [
  { value: 'SIZE_1_10', label: '1-10 employees' },
  { value: 'SIZE_11_50', label: '11-50 employees' },
  { value: 'SIZE_51_200', label: '51-200 employees' },
  { value: 'SIZE_201_500', label: '201-500 employees' },
  { value: 'SIZE_501_1000', label: '501-1000 employees' },
  { value: 'SIZE_1000_PLUS', label: '1000+ employees' },
];

const accountTypeOptions = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
  { value: 'PARTNER', label: 'Partner' },
];

const accountStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const billingCycleOptions = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'PROJECT_BASIS', label: 'Project basis' },
];

const paymentTermsOptions = [
  { value: 'NET_30', label: 'Net 30 days' },
  { value: 'NET_15', label: 'Net 15 days' },
  { value: 'NET_60', label: 'Net 60 days' },
  { value: 'DUE_ON_RECEIPT', label: 'Due on receipt' },
];

const contactRoleOptions = [
  { value: 'PRIMARY_CONTACT', label: 'Primary contact' },
  { value: 'DECISION_MAKER', label: 'Decision maker' },
  { value: 'INFLUENCER', label: 'Influencer' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'GATEKEEPER', label: 'Gatekeeper' },
];

const initialContactRow = {
  id: 1,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: '',
  role: 'PRIMARY_CONTACT',
  isPrimary: true,
};

export default function NewClientAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const canCreateClientAccounts = canWriteCRM('client_accounts');

  const { options: industrySelectOptions, onIndustrySaved } = useIndustrySelectOptions({
    fetchStoredIndustries: fetchStoredIndustriesForCrm,
  });

  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    industryOther: '',
    type: '',
    website: '',
    phone: '',
    email: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    accountType: 'STANDARD',
    status: 'ACTIVE',
    employees: '',
    dealValue: '',
    healthScore: '75',
    founded: '',
    onboardingDate: '',
    contractStartDate: '',
    contractEndDate: '',
    billingCycle: 'MONTHLY',
    paymentTerms: 'NET_30',
    linkedIn: '',
    twitter: '',
    notes: '',
    assignedTo: '',
  });

  const [contacts, setContacts] = useState([{ ...initialContactRow }]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      let allUsers = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        const queryParams = {
          'pagination[page]': page,
          'pagination[pageSize]': pageSize,
          populate: 'primaryRole,userRoles',
        };
        const response = await strapiClient.getXtrawrkxUsers(queryParams);
        const usersData = response?.data ?? response ?? [];
        const arr = Array.isArray(usersData) ? usersData : [];
        const extracted = arr.map((u) =>
          u.attributes ? { id: u.id, documentId: u.id, ...u.attributes } : u
        );
        allUsers = [...allUsers, ...extracted];
        const pageCount = response?.meta?.pagination?.pageCount ?? 1;
        hasMore = page < pageCount && arr.length === pageSize;
        page += 1;
      }

      setUsers(allUsers);

      if (user?.email && allUsers.length > 0) {
        const currentUser = allUsers.find((u) => u.email === user.email);
        if (currentUser) {
          setForm((prev) => ({ ...prev, assignedTo: String(currentUser.id) }));
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'industry' && value !== INDUSTRY_OTHER_VALUE) {
        next.industryOther = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleContactChange = (contactId, field, value) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, [field]: value } : c))
    );
    const errorKey = `contact_${contactId}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
  };

  const addContact = () => {
    const newId = Math.max(...contacts.map((c) => c.id), 0) + 1;
    setContacts((prev) => [
      ...prev,
      {
        id: newId,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: '',
        role: 'CONTACT',
        isPrimary: false,
      },
    ]);
  };

  const removeContact = (contactId) => {
    if (contacts.length > 1) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    }
  };

  const setPrimaryContact = (contactId) => {
    setContacts((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === contactId,
        role: c.id === contactId ? 'PRIMARY_CONTACT' : c.role === 'PRIMARY_CONTACT' ? 'CONTACT' : c.role,
      }))
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    const resolvedIndustry = resolveIndustryForSave(form.industry, form.industryOther);
    if (!resolvedIndustry) {
      newErrors.industry = 'Industry is required';
    }
    if (form.industry === INDUSTRY_OTHER_VALUE && !form.industryOther?.trim()) {
      newErrors.industryOther = 'Please specify your industry';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    contacts.forEach((contact) => {
      if (!contact.firstName.trim()) {
        newErrors[`contact_${contact.id}_firstName`] = 'First name is required';
      }
      if (!contact.lastName.trim()) {
        newErrors[`contact_${contact.id}_lastName`] = 'Last name is required';
      }
      if (!contact.email.trim()) {
        newErrors[`contact_${contact.id}_email`] = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
        newErrors[`contact_${contact.id}_email`] = 'Please enter a valid email';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    const hsRaw = parseInt(String(form.healthScore), 10);
    const payload = {
      companyName: form.companyName.trim(),
      industry: resolveIndustryForSave(form.industry, form.industryOther),
      status: form.status,
      accountType: form.accountType,
      billingCycle: form.billingCycle,
      paymentTerms: form.paymentTerms,
      healthScore: Number.isNaN(hsRaw) ? 75 : Math.min(100, Math.max(0, hsRaw)),
    };

    if (form.type) payload.type = form.type;
    if (form.website?.trim()) payload.website = form.website.trim();
    if (form.phone?.trim()) payload.phone = form.phone.trim();
    if (form.email?.trim()) payload.email = form.email.trim();
    if (form.description?.trim()) payload.description = form.description.trim();
    if (form.address?.trim()) payload.address = form.address.trim();
    if (form.city?.trim()) payload.city = form.city.trim();
    if (form.state?.trim()) payload.state = form.state.trim();
    if (form.country?.trim()) payload.country = form.country.trim();
    if (form.zipCode?.trim()) payload.zipCode = form.zipCode.trim();
    if (form.employees) payload.employees = form.employees;
    if (form.founded?.trim()) payload.founded = form.founded.trim();
    if (form.dealValue !== '' && form.dealValue != null) {
      const n = parseFloat(String(form.dealValue));
      if (!Number.isNaN(n)) payload.dealValue = n;
    }
    if (form.linkedIn?.trim()) payload.linkedIn = form.linkedIn.trim();
    if (form.twitter?.trim()) payload.twitter = form.twitter.trim();
    if (form.notes?.trim()) payload.notes = form.notes.trim();

    if (form.onboardingDate) payload.onboardingDate = `${form.onboardingDate}T12:00:00.000Z`;
    if (form.contractStartDate) payload.contractStartDate = `${form.contractStartDate}T12:00:00.000Z`;
    if (form.contractEndDate) payload.contractEndDate = `${form.contractEndDate}T12:00:00.000Z`;

    if (form.assignedTo) {
      payload.assignedTo = parseInt(form.assignedTo, 10);
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreateClientAccounts) {
      setErrors({ submit: 'You only have read access to client accounts.' });
      return;
    }
    if (!validateForm()) {
      setShowValidationModal(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const res = await clientAccountService.create(payload);
      onIndustrySaved(payload.industry);
      const newId = res?.id ?? res?.data?.id;

      if (newId && contactService?.create) {
        const companyFields = contactFieldsFromClientAccount({
          companyName: form.companyName.trim(),
          website: form.website,
          address: form.address,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        });
        const validContacts = contacts.filter(
          (c) => c.firstName?.trim() && c.lastName?.trim() && c.email?.trim()
        );
        const accountId = parseInt(String(newId), 10);
        const clientAccountRef = Number.isNaN(accountId) ? newId : accountId;

        for (const contact of validContacts) {
          const contactData = {
            firstName: contact.firstName.trim(),
            lastName: contact.lastName.trim(),
            email: contact.email.trim(),
            phone: contact.phone?.trim(),
            jobTitle: contact.jobTitle?.trim(),
            department: contact.department?.trim(),
            contactRole: contact.role,
            status: 'ACTIVE',
            source: 'CLIENT_ACCOUNT',
            clientAccount: clientAccountRef,
            isPrimaryContact: !!contact.isPrimary,
            ...companyFields,
          };
          if (form.assignedTo) {
            contactData.assignedTo = parseInt(form.assignedTo, 10);
          }
          try {
            await contactService.create(contactData);
          } catch (err) {
            console.error('Error creating contact:', err);
          }
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push(newId ? `/clients/accounts/${newId}` : '/clients/accounts');
      }, 1600);
    } catch (error) {
      const message =
        error?.message || 'Failed to create client account. Please try again.';
      setErrors({ submit: message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-4">Client account created successfully</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!canCreateClientAccounts) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4 space-y-6">
          <CRMPageHeader
            title="View-only access"
            subtitle="Members can read client accounts, but cannot create or update them."
            breadcrumb={[
              { label: 'Sales', href: '/sales' },
              { label: 'Client Accounts', href: '/clients/accounts' },
              { label: 'New Client Account', href: '/clients/accounts/new' },
            ]}
            showSearch={false}
            showActions={false}
          />
          <Card variant="elevated" className="rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              You cannot create client accounts with your current role.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
              Client account creation, editing, and deletion require write or manage access.
            </p>
            <Button type="button" variant="primary" className="mt-6" onClick={() => router.push('/clients/accounts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to client accounts
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validation Error"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Please fill in all required fields
              </h4>
              <p className="text-gray-600 mb-4">
                The following information is required to create a client account:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {errors.companyName && (
                  <li className="font-medium text-red-700">Company name</li>
                )}
                {errors.industry && <li className="font-medium text-red-700">Industry</li>}
                {errors.email && (
                  <li className="font-medium text-red-700">Company email (valid format)</li>
                )}
                {Object.keys(errors).filter((k) => k.includes('contact_')).length > 0 && (
                  <li className="font-medium text-red-700">
                    Contact information (first name, last name, and valid email for each contact)
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowValidationModal(false)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
            >
              Got it, I&apos;ll fix these
            </Button>
          </div>
        </div>
      </Modal>

      <div className="p-4 space-y-6">
        <CRMPageHeader
          title="Add New Client Account"
          subtitle="Create a new client company account with contacts, billing, and profile details"
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: 'Client Accounts', href: '/clients/accounts' },
            { label: 'Add New', href: '/clients/accounts/new' },
          ]}
          showProfile={true}
          showSearch={false}
          showActions={false}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.keys(errors).length > 0 && !errors.submit && (
            <div className="rounded-xl bg-red-50 border-2 border-red-300 p-5 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-900 font-semibold text-lg mb-2">
                    Validation error — please check required fields
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    {errors.companyName && (
                      <li className="font-medium">Company name is required</li>
                    )}
                    {errors.industry && <li className="font-medium">Industry is required</li>}
                    {errors.email && <li className="font-medium">{errors.email}</li>}
                    {Object.keys(errors).filter((k) => k.includes('contact_')).length > 0 && (
                      <li className="font-medium">
                        Contact information: first name, last name, and valid email for each contact
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Company Information */}
          <FormSectionCard
            icon={Building2}
            title="Company Information"
            description="Basic information about the client company"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Input
                  label="Company Name *"
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  error={errors.companyName}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Select
                  label="Industry *"
                  value={form.industry}
                  onChange={(value) => handleChange('industry', value)}
                  options={industrySelectOptions}
                  error={errors.industry}
                  placeholder="Select industry"
                  icon={Building2}
                  allowCustom
                  searchable
                />
              </div>
              {form.industry === INDUSTRY_OTHER_VALUE ? (
                <div>
                  <Input
                    label="Specify industry *"
                    value={form.industryOther}
                    onChange={(e) => handleChange('industryOther', e.target.value)}
                    error={errors.industryOther}
                    placeholder="Enter your industry"
                    icon={Briefcase}
                  />
                </div>
              ) : null}

              <div>
                <Select
                  label="Company Type"
                  value={form.type}
                  onChange={(value) => handleChange('type', value)}
                  options={companyTypes.map((t) => ({ value: t.id, label: t.name }))}
                  placeholder="Select company type"
                  icon={Layers}
                />
              </div>

              <div>
                <Input
                  label="Website"
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://company.com"
                  icon={Globe}
                />
              </div>
              <div>
                <Input
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  icon={Phone}
                />
              </div>
              <div>
                <Input
                  label="Company Email *"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="contact@company.com"
                  icon={Mail}
                />
              </div>

              <div className="lg:col-span-3">
                <Textarea
                  label="Company Description"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of the company and their business..."
                  rows={3}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Address */}
          <FormSectionCard
            icon={MapPinned}
            title="Address Information"
            description="Location and contact address details"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <Input
                  label="Street Address"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  icon={MapPin}
                />
              </div>
              <div>
                <Input
                  label="City"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Input
                  label="State/Province"
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div>
                <Input
                  label="ZIP/Postal Code"
                  value={form.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="10001"
                />
              </div>
              <div>
                <Input
                  label="Country"
                  value={form.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Account details */}
          <FormSectionCard
            icon={Briefcase}
            title="Account Details"
            description="Account type, status, and business metrics"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Select
                  label="Account Type"
                  value={form.accountType}
                  onChange={(value) => handleChange('accountType', value)}
                  options={accountTypeOptions}
                  icon={Briefcase}
                />
              </div>
              <div>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(value) => handleChange('status', value)}
                  options={accountStatusOptions}
                />
              </div>
              <div>
                <Select
                  label="Company Size"
                  value={form.employees}
                  onChange={(value) => handleChange('employees', value)}
                  options={employeeSizeOptions}
                  placeholder="Select company size"
                />
              </div>
              <div>
                <Input
                  label="Annual Revenue"
                  type="number"
                  value={form.dealValue}
                  onChange={(e) => handleChange('dealValue', e.target.value)}
                  placeholder="1000000"
                  min={0}
                  step="0.01"
                  icon={DollarSign}
                />
              </div>
              <div>
                <Input
                  label="Health Score (%)"
                  type="number"
                  value={form.healthScore}
                  onChange={(e) => handleChange('healthScore', e.target.value)}
                  placeholder="75"
                  min={0}
                  max={100}
                  icon={TrendingUp}
                />
              </div>
              <div>
                <Input
                  label="Founded Year"
                  type="number"
                  value={form.founded}
                  onChange={(e) => handleChange('founded', e.target.value)}
                  placeholder="2020"
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <Select
                  label="Assigned To"
                  value={form.assignedTo}
                  onChange={(value) => handleChange('assignedTo', value)}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...users.map((u) => ({
                      value: String(u.id),
                      label:
                        `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                    })),
                  ]}
                  disabled={loadingUsers}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Contact persons */}
          <FormSectionCard
            icon={Users}
            title="Contact persons"
            description="Add people linked to this client account"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
            headerAction={
              <Button
                type="button"
                onClick={addContact}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add contact
              </Button>
            }
          >
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="relative rounded-xl border border-white/30 bg-gradient-to-br from-white/60 to-white/40 p-4 backdrop-blur-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Contact {index + 1}</span>
                      {contact.isPrimary && (
                        <Badge variant="success" size="sm">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!contact.isPrimary && (
                        <Button
                          type="button"
                          onClick={() => setPrimaryContact(contact.id)}
                          size="sm"
                          variant="outline"
                        >
                          Set as primary
                        </Button>
                      )}
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Input
                      label="First name *"
                      value={contact.firstName}
                      onChange={(e) =>
                        handleContactChange(contact.id, 'firstName', e.target.value)
                      }
                      error={errors[`contact_${contact.id}_firstName`]}
                      placeholder="John"
                    />
                    <Input
                      label="Last name *"
                      value={contact.lastName}
                      onChange={(e) =>
                        handleContactChange(contact.id, 'lastName', e.target.value)
                      }
                      error={errors[`contact_${contact.id}_lastName`]}
                      placeholder="Doe"
                    />
                    <Input
                      label="Email *"
                      type="email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(contact.id, 'email', e.target.value)}
                      error={errors[`contact_${contact.id}_email`]}
                      placeholder="john.doe@company.com"
                      icon={Mail}
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(contact.id, 'phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      icon={Phone}
                    />
                    <Input
                      label="Job title"
                      value={contact.jobTitle}
                      onChange={(e) =>
                        handleContactChange(contact.id, 'jobTitle', e.target.value)
                      }
                      placeholder="CEO, Manager, etc."
                    />
                    <Input
                      label="Department"
                      value={contact.department}
                      onChange={(e) =>
                        handleContactChange(contact.id, 'department', e.target.value)
                      }
                      placeholder="Sales, Marketing, IT, etc."
                    />
                    <div className="md:col-span-2 lg:col-span-1">
                      <Select
                        label="Contact role"
                        value={contact.role}
                        onChange={(value) => handleContactChange(contact.id, 'role', value)}
                        options={contactRoleOptions}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FormSectionCard>

          {/* Contract & billing */}
          <FormSectionCard
            icon={Calendar}
            title="Contract &amp; Billing"
            description="Contract dates and billing preferences"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Input
                  label="Onboarding Date"
                  type="date"
                  value={form.onboardingDate}
                  onChange={(e) => handleChange('onboardingDate', e.target.value)}
                  icon={Calendar}
                />
              </div>
              <div>
                <Input
                  label="Contract Start Date"
                  type="date"
                  value={form.contractStartDate}
                  onChange={(e) => handleChange('contractStartDate', e.target.value)}
                  icon={Calendar}
                />
              </div>
              <div>
                <Input
                  label="Contract End Date"
                  type="date"
                  value={form.contractEndDate}
                  onChange={(e) => handleChange('contractEndDate', e.target.value)}
                  icon={Calendar}
                />
              </div>
              <div>
                <Select
                  label="Billing Cycle"
                  value={form.billingCycle}
                  onChange={(value) => handleChange('billingCycle', value)}
                  options={billingCycleOptions}
                />
              </div>
              <div>
                <Select
                  label="Payment Terms"
                  value={form.paymentTerms}
                  onChange={(value) => handleChange('paymentTerms', value)}
                  options={paymentTermsOptions}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Social & notes */}
          <FormSectionCard
            icon={FileText}
            title="Social &amp; Additional Information"
            description="Social media profiles and additional notes"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="LinkedIn Profile"
                  type="url"
                  value={form.linkedIn}
                  onChange={(e) => handleChange('linkedIn', e.target.value)}
                  placeholder="https://linkedin.com/company/companyname"
                  icon={Linkedin}
                />
              </div>
              <div>
                <Input
                  label="Twitter Handle"
                  value={form.twitter}
                  onChange={(e) => handleChange('twitter', e.target.value)}
                  placeholder="@companyname"
                  icon={AtSign}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes about this client account..."
                  rows={3}
                />
              </div>
            </div>
          </FormSectionCard>

          {errors.submit && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-100">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-gray-500 text-center sm:text-right order-2 sm:order-1">
                * Required fields
              </span>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="order-1 sm:order-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 min-w-[200px] justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Client Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
