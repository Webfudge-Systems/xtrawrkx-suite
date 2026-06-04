'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
  FormSectionCard,
  useIndustrySelectOptions,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import leadCompanyService from '../../../../lib/api/leadCompanyService';
import contactService from '../../../../lib/api/contactService';
import strapiClient from '../../../../lib/strapiClient';
import { useAuth } from '@webfudge/auth';
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  IndianRupee,
  Calendar,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { companyTypes } from '@webfudge/utils';
import { fetchStoredIndustriesForCrm } from '../../../../lib/industryOptionsLoader';

export default function AddLeadCompanyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { options: industrySelectOptions, onIndustrySaved } = useIndustrySelectOptions({
    fetchStoredIndustries: fetchStoredIndustriesForCrm,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: '',
    type: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    employees: '',
    founded: '',
    description: '',
    linkedIn: '',
    twitter: '',
    leadSource: 'WEBSITE',
    status: 'NEW',
    dealValue: '',
    notes: '',
    nextConnectDate: '',
    assignedTo: '',
  });

  const [contacts, setContacts] = useState([
    {
      id: 1,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
      role: 'PRIMARY_CONTACT',
      isPrimary: true,
    },
  ]);

  const leadSourceOptions = [
    { value: 'WEBSITE', label: 'Website' },
    { value: 'REFERRAL', label: 'Referral' },
    { value: 'SOCIAL_MEDIA', label: 'Social Media' },
    { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
    { value: 'COLD_CALL', label: 'Cold Call' },
    { value: 'TRADE_SHOW', label: 'Trade Show' },
    { value: 'PARTNER', label: 'Partner' },
    { value: 'OTHER', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  ];

  const contactRoleOptions = [
    { value: 'PRIMARY_CONTACT', label: 'Primary contact' },
    { value: 'DECISION_MAKER', label: 'Decision Maker' },
    { value: 'INFLUENCER', label: 'Influencer' },
    { value: 'CONTACT', label: 'Contact' },
    { value: 'GATEKEEPER', label: 'Gatekeeper' },
  ];

  const employeeSizeOptions = [
    { value: 'SIZE_1_10', label: '1-10 employees' },
    { value: 'SIZE_11_50', label: '11-50 employees' },
    { value: 'SIZE_51_200', label: '51-200 employees' },
    { value: 'SIZE_201_500', label: '201-500 employees' },
    { value: 'SIZE_501_1000', label: '501-1000 employees' },
    { value: 'SIZE_1000_PLUS', label: '1000+ employees' },
  ];

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
          u.attributes
            ? { id: u.id, documentId: u.id, ...u.attributes }
            : u
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
          setCompanyData((prev) => ({
            ...prev,
            assignedTo: String(currentUser.id),
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCompanyChange = (field, value) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
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
      prev.map((c) => ({ ...c, isPrimary: c.id === contactId }))
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!companyData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!companyData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (!companyData.email.trim()) {
      newErrors.email = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(companyData.email)) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setShowValidationModal(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const leadCompanyPayload = {
        companyName: companyData.companyName.trim(),
        industry: companyData.industry,
        status: companyData.status,
        source: companyData.leadSource,
        segment: 'WARM',
        score: Math.floor(Math.random() * 100) + 1,
        healthScore: Math.floor(Math.random() * 100) + 1,
        dealValue: companyData.dealValue ? parseFloat(companyData.dealValue) : 0,
      };
      if (companyData.type) leadCompanyPayload.type = companyData.type;
      if (companyData.website?.trim()) leadCompanyPayload.website = companyData.website.trim();
      if (companyData.phone?.trim()) leadCompanyPayload.phone = companyData.phone.trim();
      if (companyData.email?.trim()) leadCompanyPayload.email = companyData.email.trim();
      if (companyData.address?.trim()) leadCompanyPayload.address = companyData.address.trim();
      if (companyData.city?.trim()) leadCompanyPayload.city = companyData.city.trim();
      if (companyData.state?.trim()) leadCompanyPayload.state = companyData.state.trim();
      if (companyData.country?.trim()) leadCompanyPayload.country = companyData.country.trim();
      if (companyData.zipCode?.trim()) leadCompanyPayload.zipCode = companyData.zipCode.trim();
      if (companyData.employees) leadCompanyPayload.employees = companyData.employees;
      if (companyData.founded?.trim()) leadCompanyPayload.founded = companyData.founded.trim();
      if (companyData.description?.trim()) leadCompanyPayload.description = companyData.description.trim();
      if (companyData.linkedIn?.trim()) leadCompanyPayload.linkedIn = companyData.linkedIn.trim();
      if (companyData.twitter?.trim()) leadCompanyPayload.twitter = companyData.twitter.trim();
      if (companyData.notes?.trim()) leadCompanyPayload.notes = companyData.notes.trim();
      if (companyData.nextConnectDate?.trim()) {
        leadCompanyPayload.nextConnectDate = companyData.nextConnectDate.trim();
      }
      if (companyData.assignedTo) {
        leadCompanyPayload.assignedTo = parseInt(companyData.assignedTo, 10);
      }

      const createdCompany = await leadCompanyService.create(leadCompanyPayload);
      onIndustrySaved(leadCompanyPayload.industry);
      const companyId = createdCompany?.id ?? createdCompany?.data?.id;

      if (companyId && contacts.length > 0 && contactService?.create) {
        const validContacts = contacts.filter(
          (c) =>
            c.firstName?.trim() &&
            c.lastName?.trim() &&
            c.email?.trim()
        );
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
            source: 'LEAD_COMPANY',
            leadCompany: companyId,
            isPrimaryContact: !!contact.isPrimary,
            companyName: companyData.companyName.trim(),
          };
          if (companyData.assignedTo) {
            contactData.assignedTo = parseInt(companyData.assignedTo, 10);
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
        router.push(companyId ? `/sales/lead-companies/${companyId}` : '/sales/lead-companies');
      }, 2000);
    } catch (error) {
      console.error('Error creating lead company:', error);
      const message =
        error?.message || 'Failed to create lead company. Please try again.';
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
          <p className="text-gray-600 mb-4">Lead company created successfully</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Redirecting to company details...</p>
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
                The following information is required to create a lead company:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {errors.companyName && <li className="font-medium text-red-700">Company Name</li>}
                {errors.industry && <li className="font-medium text-red-700">Industry</li>}
                {errors.email && (
                  <li className="font-medium text-red-700">Company Email (must be valid)</li>
                )}
                {Object.keys(errors).filter((k) => k.includes('contact_')).length > 0 && (
                  <li className="font-medium text-red-700">
                    Contact Information (First Name, Last Name, and valid Email for each contact)
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
          title="Add New Lead Company"
          subtitle="Create a new lead company with contact information"
        breadcrumb={[
            { label: 'Dashboard', href: '/' },
          { label: 'Sales', href: '/sales' },
            { label: 'Lead Companies', href: '/sales/lead-companies' },
            { label: 'Add New', href: '/sales/lead-companies/new' },
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
                    Validation Error - Please fill in all required fields
                  </h4>
                  <p className="text-red-700 mb-3">
                    The following fields are required or contain invalid information:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    {errors.companyName && (
                      <li className="font-medium">Company Name is required</li>
                    )}
                    {errors.industry && (
                      <li className="font-medium">Industry is required</li>
                    )}
                    {errors.email && <li className="font-medium">{errors.email}</li>}
                    {Object.keys(errors).filter((k) => k.includes('contact_')).length > 0 && (
                      <li className="font-medium">
                        Contact information: First Name, Last Name, and valid Email for each contact
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
            description="Basic information about the lead company"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Input
                  label="Company Name *"
                  value={companyData.companyName}
                  onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                  error={errors.companyName}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Select
                  label="Industry *"
                  value={companyData.industry}
                  onChange={(value) => handleCompanyChange('industry', value)}
                  options={industrySelectOptions}
                  error={errors.industry}
                  placeholder="Select industry"
                  icon={Building2}
                  allowCustom
                  searchable
                />
              </div>

              <div>
                <Select
                  label="Company Type"
                  value={companyData.type}
                  onChange={(value) => handleCompanyChange('type', value)}
                  options={companyTypes.map((t) => ({ value: t.id, label: t.name }))}
                  placeholder="Select company type"
                  icon={Layers}
                />
              </div>

              <div>
                <Input
                  label="Website"
                  type="url"
                  value={companyData.website}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  placeholder="https://company.com"
                  icon={Globe}
                />
              </div>
              <div>
                <Input
                  label="Phone"
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  icon={Phone}
                />
              </div>
              <div>
                <Input
                  label="Company Email *"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="contact@company.com"
                  icon={Mail}
                />
              </div>

              <div className="lg:col-span-2">
                <Input
                  label="Address"
                  value={companyData.address}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  placeholder="Street address"
                  icon={MapPin}
                />
              </div>
              <div>
                <Input
                  label="City"
                  value={companyData.city}
                  onChange={(e) => handleCompanyChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Input
                  label="State/Province"
                  value={companyData.state}
                  onChange={(e) => handleCompanyChange('state', e.target.value)}
                  placeholder="State or Province"
                />
              </div>
              <div>
                <Input
                  label="Country"
                  value={companyData.country}
                  onChange={(e) => handleCompanyChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div>
                <Input
                  label="ZIP/Postal Code"
                  value={companyData.zipCode}
                  onChange={(e) => handleCompanyChange('zipCode', e.target.value)}
                  placeholder="ZIP or Postal Code"
                />
              </div>

              <div>
                <Select
                  label="Company Size"
                  value={companyData.employees}
                  onChange={(value) => handleCompanyChange('employees', value)}
                  options={employeeSizeOptions}
                  placeholder="Select company size"
                />
              </div>
              <div>
                <Input
                  label="Founded Year"
                  type="number"
                  value={companyData.founded}
                  onChange={(e) => handleCompanyChange('founded', e.target.value)}
                  placeholder="2020"
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <Input
                  label="Deal Value"
                  type="number"
                  value={companyData.dealValue}
                  onChange={(e) => handleCompanyChange('dealValue', e.target.value)}
                  placeholder="25000"
                  min={0}
                  step="0.01"
                  icon={IndianRupee}
                />
              </div>

              <div>
                <Input
                  label="LinkedIn"
                  value={companyData.linkedIn}
                  onChange={(e) => handleCompanyChange('linkedIn', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div>
                <Input
                  label="Twitter"
                  value={companyData.twitter}
                  onChange={(e) => handleCompanyChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div>
                <Select
                  label="Lead Source"
                  value={companyData.leadSource}
                  onChange={(value) => handleCompanyChange('leadSource', value)}
                  options={leadSourceOptions}
                />
              </div>
              <div>
                <Select
                  label="Assigned To"
                  value={companyData.assignedTo}
                  onChange={(value) => handleCompanyChange('assignedTo', value)}
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

              <div className="lg:col-span-3">
                <Textarea
                  label="Company Description"
                  value={companyData.description}
                  onChange={(e) => handleCompanyChange('description', e.target.value)}
                  placeholder="Brief description of the company and their business..."
                  rows={3}
                />
              </div>
              <div className="lg:col-span-3">
                <Textarea
                  label="Notes"
                  value={companyData.notes}
                  onChange={(e) => handleCompanyChange('notes', e.target.value)}
                  placeholder="Additional notes about this lead..."
                  rows={2}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Contact Information */}
          <FormSectionCard
            icon={Users}
            title="Contact Information"
            description="Add contacts for this lead company"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
            headerAction={
              <Button
                type="button"
                onClick={addContact}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            }
          >
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="relative p-4 rounded-xl bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
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
                          Set as Primary
                        </Button>
                      )}
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Input
                        label="First Name *"
                        value={contact.firstName}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'firstName', e.target.value)
                        }
                        error={errors[`contact_${contact.id}_firstName`]}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Input
                        label="Last Name *"
                        value={contact.lastName}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'lastName', e.target.value)
                        }
                        error={errors[`contact_${contact.id}_lastName`]}
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <Input
                        label="Email *"
                        type="email"
                        value={contact.email}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'email', e.target.value)
                        }
                        error={errors[`contact_${contact.id}_email`]}
                        placeholder="john.doe@company.com"
                        icon={Mail}
                      />
                    </div>
                    <div>
                      <Input
                        label="Phone"
                        type="tel"
                        value={contact.phone}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'phone', e.target.value)
                        }
                        placeholder="+1 (555) 123-4567"
                        icon={Phone}
                      />
                    </div>
                    <div>
                      <Input
                        label="Job Title"
                        value={contact.jobTitle}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'jobTitle', e.target.value)
                        }
                        placeholder="CEO, Manager, etc."
                      />
                    </div>
                    <div>
                      <Input
                        label="Department"
                        value={contact.department}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'department', e.target.value)
                        }
                        placeholder="Sales, Marketing, IT, etc."
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-1">
                      <Select
                        label="Contact Role"
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

          {/* Lead Status */}
          <FormSectionCard
            icon={Calendar}
            title="Lead Status"
            description="Set the initial status for this lead"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Initial Status"
                  value={companyData.status}
                  onChange={(value) => handleCompanyChange('status', value)}
                  options={statusOptions}
                />
              </div>
              <div>
                <Select
                  label="Lead Source"
                  value={companyData.leadSource}
                  onChange={(value) => handleCompanyChange('leadSource', value)}
                  options={leadSourceOptions}
                />
              </div>
              <div>
                <Input
                  label="Next connect date"
                  type="date"
                  value={companyData.nextConnectDate}
                  onChange={(e) => handleCompanyChange('nextConnectDate', e.target.value)}
                  icon={Calendar}
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

          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Lead Company
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
