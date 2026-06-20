# Xtrawrkx LinkedIn Extension Setup Guide

This guide explains how to install and use the Xtrawrkx LinkedIn Extension.

The extension helps you import visible LinkedIn profile and company details into the Xtrawrkx CRM.

## Before You Start

You need:

- Google Chrome installed
- Access to LinkedIn
- Your Xtrawrkx CRM login details
- The extension ZIP file or Chrome Web Store link shared by the Xtrawrkx team

## Option 1: Install From Chrome Web Store

Use this option if the Xtrawrkx team shared a Chrome Web Store link.

1. Open the Chrome Web Store link.
2. Click **Add to Chrome**.
3. Click **Add extension** when Chrome asks for confirmation.
4. Wait for the extension to install.
5. Click the puzzle icon in the Chrome toolbar.
6. Find **Xtrawrkx LinkedIn Extension**.
7. Click the pin icon so the extension stays visible.

Chrome will update the extension automatically when a new version is published.

## Option 2: Install Manually For Testing

Use this option only if the Xtrawrkx team shared a ZIP file for testing.

### Extract The ZIP

1. Download the ZIP file.
2. Right-click the ZIP file and select **Extract All**.
3. Choose a safe location on your computer.
4. Open the extracted folder and confirm it contains `manifest.json`.

Important: Chrome must load the folder that directly contains `manifest.json`.

### Load The Extension

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select the extracted extension folder.
6. Click **Select Folder**.

The extension should now appear in Chrome.

## Pin The Extension

1. Click the puzzle icon in the Chrome toolbar.
2. Find **Xtrawrkx LinkedIn Extension**.
3. Click the pin icon.

This keeps the extension visible while you work on LinkedIn.

## Sign In

1. Click the Xtrawrkx extension icon.
2. The sidebar will open.
3. Click **Sign In**.
4. Enter your Xtrawrkx CRM email and password.
5. Click **Sign In**.

After signing in, the extension is ready to use.

## Import A LinkedIn Profile

1. Open LinkedIn.
2. Visit a LinkedIn profile page.
3. Click the Xtrawrkx extension icon.
4. Review the detected profile details.
5. If the person has multiple roles, select the correct experience.
6. Click **Import to CRM**.

The contact will be added to the Xtrawrkx CRM.

## Import A LinkedIn Company

1. Open a LinkedIn company page.
2. Click the Xtrawrkx extension icon.
3. Review the detected company details.
4. Click **Import to CRM** or **Import Company**.

The company will be added to the Xtrawrkx CRM.

## Updating The Extension

### Chrome Web Store Install

No manual action is usually required. Chrome updates the extension automatically.

### Manual Testing Install

If the Xtrawrkx team sends a new ZIP:

1. Extract the new ZIP.
2. Go to `chrome://extensions`.
3. Find **Xtrawrkx LinkedIn Extension**.
4. Click **Remove** on the old version.
5. Click **Load unpacked**.
6. Select the new extracted folder.

## Troubleshooting

### Extension Is Not Visible

- Click the puzzle icon in Chrome.
- Pin **Xtrawrkx LinkedIn Extension**.
- Refresh the LinkedIn page.

### Extension Does Not Load

- Make sure **Developer mode** is enabled.
- Make sure you selected the folder that directly contains `manifest.json`.
- Try removing the extension and loading it again.
- Restart Chrome if needed.

### Sign In Fails

- Confirm your email and password.
- Confirm you have access to the Xtrawrkx CRM.
- Check your internet connection.
- Contact the Xtrawrkx team if your account is not active.

### Profile Details Are Missing Or Wrong

- Wait a few seconds for LinkedIn to finish loading.
- Scroll through the profile once so LinkedIn loads all sections.
- Refresh the LinkedIn page.
- Open the extension again.
- Select the correct experience before importing.

### Import Does Not Work

- Make sure you are signed in.
- Make sure you are on a LinkedIn profile or company page.
- Refresh LinkedIn and try again.
- If the issue continues, share the LinkedIn URL and a screenshot with the Xtrawrkx team.

## Data And Security

The extension connects to:

- LinkedIn pages you open in Chrome
- Xtrawrkx CRM API: `https://xtrawrkxsuits-production.up.railway.app`

The extension is used to send selected LinkedIn profile/company details to the Xtrawrkx CRM. It does not run bulk imports automatically.

## Support

If you face an issue, please share:

- Your Chrome version
- A screenshot of the issue
- The LinkedIn profile or company URL
- Whether you installed from Chrome Web Store or manually

## Version

Extension version: `1.2.0`

Last updated: June 2026
