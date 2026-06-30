export {
  createEmailTransporter,
  getEmailCredentials,
  getTransactionalEmailAddress,
  isSmtpConfigured,
} from "./transporter.js";

export {
  getEventsTransactionalMailOptions,
  getAccountTransactionalMailOptions,
} from "./transactional.js";

export {
  getPasswordResetEmailTemplate,
  sendPasswordResetEmail,
} from "./passwordReset.js";
