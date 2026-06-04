"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Shield, Eye, EyeOff, Users, Building } from "lucide-react";

export default function RoleBasedAccessDemo() {
  const {
    user,
    account,
    contacts,
    currentContact,
    switchContact,
    hasPermission,
    canAccessSection,
    isPrimaryContact,
  } = useAuth();

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to view role-based access controls.
        </AlertDescription>
      </Alert>
    );
  }

  const getAccessLevelColor = (level) => {
    const colors = {
      FULL_ACCESS: "bg-green-100 text-green-800",
      PROJECT_VIEW: "bg-blue-100 text-blue-800",
      INVOICE_VIEW: "bg-yellow-100 text-yellow-800",
      READ_ONLY: "bg-gray-100 text-gray-800",
      NO_ACCESS: "bg-red-100 text-red-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const getRoleColor = (role) => {
    const colors = {
      PRIMARY_CONTACT: "bg-purple-100 text-purple-800",
      DECISION_MAKER: "bg-red-100 text-red-800",
      INFLUENCER: "bg-orange-100 text-orange-800",
      USER: "bg-blue-100 text-blue-800",
      GATEKEEPER: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const sections = [
    { key: "dashboard", name: "Dashboard", icon: "📊" },
    { key: "projects", name: "Projects", icon: "📁" },
    { key: "files", name: "Files", icon: "📄" },
    { key: "invoices", name: "Invoices", icon: "💰" },
    { key: "settings", name: "Settings", icon: "⚙️" },
    { key: "team", name: "Team Management", icon: "👥" },
  ];

  const permissions = [
    { key: "view", name: "View Content", icon: "👀" },
    { key: "comment", name: "Add Comments", icon: "💬" },
    { key: "upload", name: "Upload Files", icon: "📤" },
    { key: "manage", name: "Manage Content", icon: "🔧" },
    { key: "invite", name: "Invite Users", icon: "➕" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Company account and contact management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{account?.companyName}</h3>
              <p className="text-sm text-gray-600">{account?.industry}</p>
              <p className="text-sm text-gray-600">{account?.email}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Current Contact:</Label>
              <Select
                value={currentContact?.id?.toString()}
                onValueChange={(value) => switchContact(parseInt(value))}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {contact.firstName} {contact.lastName}
                        <Badge className={getRoleColor(contact.role)}>
                          {contact.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentContact && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {currentContact.firstName} {currentContact.lastName}
                  </span>
                  <Badge className={getRoleColor(currentContact.role)}>
                    {currentContact.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Access Level:</span>
                  <Badge
                    className={getAccessLevelColor(
                      currentContact.portalAccessLevel
                    )}
                  >
                    {currentContact.portalAccessLevel?.replace("_", " ")}
                  </Badge>
                </div>
                {isPrimaryContact && (
                  <div className="mt-2 text-sm text-purple-600 font-medium">
                    ✨ Primary Contact - Full Access Granted
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Section Access
            </CardTitle>
            <CardDescription>
              Portal sections available to current contact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.key}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span>{section.icon}</span>
                    <span className="text-sm">{section.name}</span>
                  </div>
                  {canAccessSection(section.key) ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Eye className="w-3 h-3 mr-1" />
                      Allowed
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Denied
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Action Permissions
            </CardTitle>
            <CardDescription>
              Actions available to current contact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div
                  key={permission.key}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span>{permission.icon}</span>
                    <span className="text-sm">{permission.name}</span>
                  </div>
                  {hasPermission(permission.key) ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Eye className="w-3 h-3 mr-1" />
                      Allowed
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Denied
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Account Contacts
          </CardTitle>
          <CardDescription>
            All contacts associated with {account?.companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <div>
                    <div className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{contact.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(contact.role)}>
                    {contact.role}
                  </Badge>
                  <Badge
                    className={getAccessLevelColor(contact.portalAccessLevel)}
                  >
                    {contact.portalAccessLevel?.replace("_", " ")}
                  </Badge>
                  {contact.id === currentContact?.id && (
                    <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



