export const supportConfig = {
  title: "Support Team",
  description: "Our internal team has not assigned a dedicated POC yet.",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "clientsupport@xtrawrkx.com",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+1 (800) 472-8830",
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "",
  ticketUrl: process.env.NEXT_PUBLIC_SUPPORT_TICKET_URL || "/messages",
};
