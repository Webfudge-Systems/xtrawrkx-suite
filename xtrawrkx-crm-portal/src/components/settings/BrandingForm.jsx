"use client";

import { useState } from "react";
import { Card, Button, Input, Select, Checkbox } from "../../components/ui";
import {
  Upload,
  Download,
  Palette,
  Image,
  Type,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

export default function BrandingForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [brandingData, setBrandingData] = useState({
    companyName: "Xtrawrkx CRM",
    logo: null,
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    accentColor: "#f59e0b",
    fontFamily: "Inter",
    fontSize: "14px",
    borderRadius: "8px",
    theme: "light",
    customCSS: "",
    favicon: null,
    ogImage: null,
  });

  const fontFamilies = [
    { value: "Inter", label: "Inter" },
    { value: "Roboto", label: "Roboto" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Lato", label: "Lato" },
    { value: "Montserrat", label: "Montserrat" },
    { value: "Poppins", label: "Poppins" },
    { value: "Source Sans Pro", label: "Source Sans Pro" },
  ];

  const themes = [
    { value: "light", label: "Light", description: "Clean and modern light theme" },
    { value: "dark", label: "Dark", description: "Sleek dark theme for low-light environments" },
    { value: "auto", label: "Auto", description: "Follows system preference" },
  ];

  const borderRadiusOptions = [
    { value: "0px", label: "None" },
    { value: "4px", label: "Small" },
    { value: "8px", label: "Medium" },
    { value: "12px", label: "Large" },
    { value: "16px", label: "Extra Large" },
  ];

  const handleInputChange = (field, value) => {
    setBrandingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBrandingData(prev => ({
        ...prev,
        [field]: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleReset = () => {
    setBrandingData({
      companyName: "Xtrawrkx CRM",
      logo: null,
      primaryColor: "#2563eb",
      secondaryColor: "#64748b",
      accentColor: "#f59e0b",
      fontFamily: "Inter",
      fontSize: "14px",
      borderRadius: "8px",
      theme: "light",
      customCSS: "",
      favicon: null,
      ogImage: null,
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(brandingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "branding-config.json";
    link.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setBrandingData(prev => ({ ...prev, ...importedData }));
        } catch (error) {
          console.error("Error importing branding config:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Branding & Themes</h3>
          <p className="text-sm text-gray-600">
            Customize the look and feel of your CRM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("import-file").click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Palette className="w-4 h-4 mr-2" />
              Edit Branding
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Form */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <Input
                  value={brandingData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  {brandingData.logo ? (
                    <div className="relative">
                      <img
                        src={brandingData.logo}
                        alt="Company logo"
                        className="w-16 h-16 object-contain border border-gray-200 rounded-lg"
                      />
                      {isEditing && (
                        <button
                          onClick={() => handleInputChange("logo", null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {isEditing && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("logo", e.target.files[0])}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Color Scheme */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Color Scheme</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.primaryColor}
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      disabled={!isEditing}
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Input
                      value={brandingData.primaryColor}
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.secondaryColor}
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      disabled={!isEditing}
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Input
                      value={brandingData.secondaryColor}
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.accentColor}
                      onChange={(e) => handleInputChange("accentColor", e.target.value)}
                      disabled={!isEditing}
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Input
                      value={brandingData.accentColor}
                      onChange={(e) => handleInputChange("accentColor", e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Typography */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Typography</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <Select
                    value={brandingData.fontFamily}
                    onChange={(value) => handleInputChange("fontFamily", value)}
                    options={fontFamilies}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Font Size
                  </label>
                  <Select
                    value={brandingData.fontSize}
                    onChange={(value) => handleInputChange("fontSize", value)}
                    options={[
                      { value: "12px", label: "12px" },
                      { value: "14px", label: "14px" },
                      { value: "16px", label: "16px" },
                      { value: "18px", label: "18px" },
                    ]}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Theme Settings */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Theme Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {themes.map((theme) => (
                    <label
                      key={theme.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                        brandingData.theme === theme.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={theme.value}
                        checked={brandingData.theme === theme.value}
                        onChange={(e) => handleInputChange("theme", e.target.value)}
                        disabled={!isEditing}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{theme.label}</div>
                        <div className="text-sm text-gray-600">{theme.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Radius
                </label>
                <Select
                  value={brandingData.borderRadius}
                  onChange={(value) => handleInputChange("borderRadius", value)}
                  options={borderRadiusOptions}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </Card>

          {/* Custom CSS */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Custom CSS</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional CSS
              </label>
              <textarea
                value={brandingData.customCSS}
                onChange={(e) => handleInputChange("customCSS", e.target.value)}
                disabled={!isEditing}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="/* Add your custom CSS here */"
              />
            </div>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-6">
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h4>
              <div
                className="p-4 border border-gray-200 rounded-lg"
                style={{
                  fontFamily: brandingData.fontFamily,
                  fontSize: brandingData.fontSize,
                  borderRadius: brandingData.borderRadius,
                  backgroundColor: brandingData.theme === "dark" ? "#1f2937" : "#ffffff",
                  color: brandingData.theme === "dark" ? "#f9fafb" : "#111827",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {brandingData.logo && (
                    <img
                      src={brandingData.logo}
                      alt="Logo"
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <h1
                    className="text-xl font-bold"
                    style={{ color: brandingData.primaryColor }}
                  >
                    {brandingData.companyName}
                  </h1>
                </div>
                <div className="space-y-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: brandingData.primaryColor + "20",
                      borderLeft: `4px solid ${brandingData.primaryColor}`,
                    }}
                  >
                    <h3 className="font-semibold mb-1">Primary Color</h3>
                    <p className="text-sm opacity-75">This is how your primary color will look</p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: brandingData.secondaryColor + "20",
                      borderLeft: `4px solid ${brandingData.secondaryColor}`,
                    }}
                  >
                    <h3 className="font-semibold mb-1">Secondary Color</h3>
                    <p className="text-sm opacity-75">This is how your secondary color will look</p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: brandingData.accentColor + "20",
                      borderLeft: `4px solid ${brandingData.accentColor}`,
                    }}
                  >
                    <h3 className="font-semibold mb-1">Accent Color</h3>
                    <p className="text-sm opacity-75">This is how your accent color will look</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reset Button */}
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-900">Reset to Defaults</h4>
                  <p className="text-sm text-red-700">
                    This will reset all branding settings to their default values
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

