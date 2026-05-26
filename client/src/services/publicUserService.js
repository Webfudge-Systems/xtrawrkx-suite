"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, isFirebaseAvailable } from "../config/firebase";

const PROFILE_COLLECTION = "user_profiles";
const LOCAL_PROFILE_KEY = "xtrawrkx_public_profile";
const CLIENT_ACCOUNT_SETUP_WARNING_KEY = "xtrawrkx_client_account_setup_warning";

const toErrorMessage = (error, fallback) => {
  if (!error) return fallback;

  const firebaseMessages = {
    "auth/email-already-in-use": "This email is already registered. Please log in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters long.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/user-not-found": "No account was found with this email address.",
    "auth/wrong-password": "Invalid email or password.",
    "auth/network-request-failed": "Network error. Please check your connection and try again.",
  };

  return firebaseMessages[error.code] || error.message || fallback;
};

const isFirestorePermissionError = (error) => {
  return (
    error?.code === "permission-denied" ||
    error?.message?.includes("Missing or insufficient permissions")
  );
};

const getLocalProfile = (uid) => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY}:${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const setLocalProfile = (uid, profile) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY}:${uid}`, JSON.stringify(profile));
  } catch (error) {
    // Ignore storage failures and keep auth flow alive.
  }
};

const setClientAccountSetupWarning = (uid, warning) => {
  if (typeof window === "undefined" || !uid) return;
  try {
    if (!warning) {
      localStorage.removeItem(`${CLIENT_ACCOUNT_SETUP_WARNING_KEY}:${uid}`);
      return;
    }
    localStorage.setItem(
      `${CLIENT_ACCOUNT_SETUP_WARNING_KEY}:${uid}`,
      JSON.stringify({
        warning,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    // Ignore storage failures.
  }
};

const getProfileRef = (uid) => doc(db, PROFILE_COLLECTION, uid);

const normalizeProfile = (profile, user) => {
  const firstName =
    profile?.firstName ||
    user?.displayName?.split(" ").filter(Boolean)[0] ||
    "";
  const lastName =
    profile?.lastName ||
    user?.displayName?.split(" ").filter(Boolean).slice(1).join(" ") ||
    "";

  return {
    uid: user?.uid || profile?.uid || "",
    email: user?.email || profile?.email || "",
    firstName,
    lastName,
    displayName:
      profile?.displayName ||
      user?.displayName ||
      [firstName, lastName].filter(Boolean).join(" "),
    company: profile?.company || "",
    jobTitle: profile?.jobTitle || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    interests: profile?.interests || "",
    lookingFor: profile?.lookingFor || "",
    phone: profile?.phone || "",
    companyName: profile?.companyName || profile?.company || "",
    companyEmail: profile?.companyEmail || "",
    companyPhone: profile?.companyPhone || "",
    companyType: profile?.companyType || "",
    companySubType: profile?.companySubType || "",
    industry: profile?.industry || "",
    website: profile?.website || "",
    companyDescription: profile?.companyDescription || "",
    addressLine1: profile?.addressLine1 || "",
    addressLine2: profile?.addressLine2 || "",
    city: profile?.city || "",
    state: profile?.state || "",
    country: profile?.country || "",
    postalCode: profile?.postalCode || "",
    linkedin: profile?.linkedin || "",
    xProfile: profile?.xProfile || "",
    avatarUrl: profile?.avatarUrl || "",
    createdAt: profile?.createdAt || null,
    updatedAt: profile?.updatedAt || null,
  };
};

const saveProfile = async (uid, payload, { merge = true } = {}) => {
  const ref = getProfileRef(uid);

  if (merge) {
    await setDoc(
      ref,
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  await setDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const publicUserService = {
  isFirebaseAvailable() {
    return isFirebaseAvailable();
  },

  onAuthStateChanged(callback) {
    if (!isFirebaseAvailable()) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, callback);
  },

  async signIn(email, password) {
    if (!isFirebaseAvailable()) {
      throw new Error("Firebase is not available. Please check the app configuration.");
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (error) {
      throw new Error(toErrorMessage(error, "Unable to sign in."));
    }
  },

  async signUp(formData) {
    if (!isFirebaseAvailable()) {
      throw new Error("Firebase is not available. Please check the app configuration.");
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const displayName = [formData.firstName, formData.lastName]
        .filter(Boolean)
        .join(" ");

      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }

      const profilePayload = {
        uid: credential.user.uid,
        email: credential.user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName,
        company: formData.company,
        companyName: formData.companyName || formData.company,
        companyEmail: formData.companyEmail || "",
        companyPhone: formData.companyPhone || formData.phone || "",
        companyType: formData.companyType || "",
        companySubType: formData.companySubType || "",
        industry: formData.industry || "",
        website: formData.website || "",
        companyDescription: formData.companyDescription || "",
        jobTitle: formData.jobTitle,
        phone: formData.phone || "",
        addressLine1: formData.addressLine1 || "",
        addressLine2: formData.addressLine2 || "",
        city: formData.city || "",
        state: formData.state || "",
        country: formData.country || "",
        postalCode: formData.postalCode || "",
        location: formData.location,
        linkedin: formData.linkedin || "",
        xProfile: formData.xProfile || "",
        bio: formData.bio,
        interests: formData.interests,
        lookingFor: formData.lookingFor,
        createdAt: new Date().toISOString(),
      };

      setLocalProfile(credential.user.uid, profilePayload);

      try {
        await saveProfile(
          credential.user.uid,
          {
            ...profilePayload,
            createdAt: serverTimestamp(),
          },
          { merge: false }
        );
      } catch (profileError) {
        if (!isFirestorePermissionError(profileError)) {
          throw profileError;
        }
      }

      const syncResult = await this.syncProfileWithStrapi({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        companyName: formData.companyName || formData.company,
        companyEmail: formData.companyEmail || "",
        companyPhone: formData.companyPhone || formData.phone || "",
        companyType: formData.companyType || "",
        companySubType: formData.companySubType || "",
        industry: formData.industry || "",
        website: formData.website || "",
        companyDescription: formData.companyDescription || "",
        jobTitle: formData.jobTitle,
        phone: formData.phone || "",
        addressLine1: formData.addressLine1 || "",
        addressLine2: formData.addressLine2 || "",
        city: formData.city || "",
        state: formData.state || "",
        country: formData.country || "",
        postalCode: formData.postalCode || "",
        location: formData.location,
        linkedin: formData.linkedin || "",
        xProfile: formData.xProfile || "",
        bio: formData.bio,
        interests: formData.interests,
        lookingFor: formData.lookingFor,
        ensureClientAccount: true,
        initialClientPassword: formData.password,
      });

      const clientAccountSync = syncResult.data?.clientAccountSync;
      const clientAccountSetupOk =
        syncResult.ok &&
        (clientAccountSync == null ||
          !clientAccountSync.attempted ||
          clientAccountSync.ok !== false);

      if (!clientAccountSetupOk) {
        const warningMessage =
          syncResult.message ||
          clientAccountSync?.error ||
          "Client account setup failed. Use Retry Setup on your profile.";
        console.error("Client account setup failed during registration:", {
          email: credential.user.email,
          message: warningMessage,
          profileSyncOk: syncResult.data?.profileSync?.ok,
          clientAccountSync,
        });
        setClientAccountSetupWarning(credential.user.uid, warningMessage);
      } else {
        setClientAccountSetupWarning(credential.user.uid, null);
      }

      return {
        user: credential.user,
        clientAccountSetup: {
          ok: clientAccountSetupOk,
          error: clientAccountSetupOk
            ? null
            : syncResult.message ||
              clientAccountSync?.error ||
              "Client account setup failed. Use Retry Setup on your profile.",
        },
      };
    } catch (error) {
      throw new Error(toErrorMessage(error, "Unable to create your account."));
    }
  },

  async signOut() {
    if (!isFirebaseAvailable()) return;

    try {
      await signOut(auth);
    } catch (error) {
      throw new Error("Unable to sign out right now.");
    }
  },

  async getProfile(user) {
    if (!user?.uid || !db) {
      return normalizeProfile(null, user);
    }

    try {
      const snapshot = await getDoc(getProfileRef(user.uid));
      const data = snapshot.exists() ? snapshot.data() : null;
      return normalizeProfile(data || getLocalProfile(user.uid), user);
    } catch (error) {
      if (isFirestorePermissionError(error)) {
        return normalizeProfile(getLocalProfile(user.uid), user);
      }

      throw error;
    }
  },

  async upsertProfile(uid, payload) {
    if (!uid) {
      throw new Error("A user id is required to save the profile.");
    }

    try {
      await saveProfile(uid, payload, { merge: true });
    } catch (error) {
      if (isFirestorePermissionError(error)) {
        setLocalProfile(uid, {
          ...getLocalProfile(uid),
          ...payload,
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      throw new Error("Unable to save your profile right now.");
    }
  },

  async updateProfile(uid, payload) {
    if (!uid) {
      throw new Error("A user id is required to update the profile.");
    }

    try {
      await updateDoc(getProfileRef(uid), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (isFirestorePermissionError(error)) {
        setLocalProfile(uid, {
          ...getLocalProfile(uid),
          ...payload,
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      await saveProfile(uid, payload, { merge: true });
    }
  },

  async syncProfileWithStrapi(profile) {
    try {
      const response = await fetch("/api/public/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          data: null,
          message: data?.error || "Unable to sync profile with community services.",
        };
      }

      return {
        ok: true,
        data,
        message: null,
      };
    } catch (error) {
      return {
        ok: false,
        data: null,
        message: "Unable to reach the community service right now.",
      };
    }
  },

  async fetchCommunityStatus(email) {
    if (!email) {
      return {
        hasCommunity: false,
        loadingError: null,
      };
    }

    try {
      const response = await fetch(
        `/api/public/community-status?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          hasCommunity: false,
          loadingError: data?.error || "Unable to fetch community status.",
        };
      }

      return {
        hasCommunity: Boolean(data?.hasCommunity),
        hasClientAccount:
          data?.hasClientAccount !== undefined
            ? Boolean(data?.hasClientAccount)
            : Boolean(data?.clientAccount),
        clientAccount:
          data?.clientAccount && typeof data.clientAccount === "object"
            ? data.clientAccount
            : null,
        status:
          data?.clientAccount?.status || data?.status || data?.communityStatus || null,
        source:
          data?.clientAccount?.source || data?.source || data?.communitySource || null,
        communityName: data?.communityName || "",
        communitySlug: data?.communitySlug || "",
        membershipId: data?.membershipId || "",
        memberships: Array.isArray(data?.memberships) ? data.memberships : [],
        loadingError: null,
        raw: data,
      };
    } catch (error) {
      return {
        hasCommunity: false,
        loadingError: "Unable to reach the community service right now.",
      };
    }
  },

  async retryClientAccountSetup(payload) {
    if (!payload?.email) {
      return {
        ok: false,
        message: "Email is required to retry client account setup.",
        data: null,
      };
    }

    const result = await this.syncProfileWithStrapi({
      ...payload,
      ensureClientAccount: true,
    });

    if (payload?.uid) {
      if (result.ok && result.data?.clientAccountSync?.ok !== false) {
        setClientAccountSetupWarning(payload.uid, null);
      } else {
        setClientAccountSetupWarning(
          payload.uid,
          result.message ||
            result.data?.clientAccountSync?.error ||
            "Retry setup failed."
        );
      }
    }

    return result;
  },
};
