"use client";

import { useState, useEffect } from "react";
import { eventRegistrationService } from "@/src/services/databaseService";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/src/config/firebase";
import { commonToasts, toastUtils } from "@/src/utils/toast";

export default function FailedPaymentsPage() {
  const [failedPayments, setFailedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFailedPayments();
  }, []);

  const fetchFailedPayments = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "failed_payment_logs"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const payments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFailedPayments(payments);
    } catch (error) {
      setError("Failed to load failed payments");
    } finally {
      setLoading(false);
    }
  };

  const resolvePayment = async (failedPayment) => {
    try {
      const { registrationId, registrationData } = failedPayment;

      // Update the original registration
      if (failedPayment.season) {
        await eventRegistrationService.updateSeasonRegistration(
          registrationId,
          registrationData
        );
      } else {
        await eventRegistrationService.updateRegistration(
          registrationId,
          registrationData
        );
      }

      // Mark the failed payment as resolved
      const failedPaymentService = {
        update: async (id, data) => {
          const docRef = doc(db, "failed_payment_logs", id);
          await updateDoc(docRef, data);
        },
      };

      await failedPaymentService.update(failedPayment.id, {
        resolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy: "admin",
      });

      // Refresh the list
      fetchFailedPayments();

      toastUtils.success("Payment resolved successfully!");
    } catch (error) {
      toastUtils.error("Failed to resolve payment: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Failed Payments</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Failed Payments</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Failed Payment Logs</h1>

      {failedPayments.length === 0 ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          No failed payments found. All payments are processing correctly!
        </div>
      ) : (
        <div className="grid gap-6">
          {failedPayments.map((payment) => (
            <div
              key={payment.id}
              className={`border rounded-lg p-6 ${
                payment.resolved
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {payment.resolved ? "✅ Resolved" : "⚠️ Needs Attention"}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Registration ID:</strong> {payment.registrationId}
                    </div>
                    <div>
                      <strong>Payment ID:</strong> {payment.paymentId}
                    </div>
                    <div>
                      <strong>Error Type:</strong> {payment.errorType}
                    </div>
                    <div>
                      <strong>Max Retries:</strong> {payment.maxRetries}
                    </div>
                    {payment.season && (
                      <div>
                        <strong>Season:</strong> {payment.season}
                      </div>
                    )}
                    {payment.eventSlug && (
                      <div>
                        <strong>Event:</strong> {payment.eventSlug}
                      </div>
                    )}
                    <div>
                      <strong>Logged At:</strong>{" "}
                      {new Date(payment.loggedAt).toLocaleString()}
                    </div>
                    {payment.resolved && (
                      <div>
                        <strong>Resolved At:</strong>{" "}
                        {new Date(payment.resolvedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {payment.registrationData && (
                    <div className="mt-4">
                      <strong>Company:</strong>{" "}
                      {payment.registrationData.companyName}
                      <br />
                      <strong>Email:</strong>{" "}
                      {payment.registrationData.companyEmail}
                      <br />
                      <strong>Amount:</strong> ₹
                      {payment.registrationData.totalCost}
                    </div>
                  )}
                </div>

                {!payment.resolved && (
                  <button
                    onClick={() => resolvePayment(payment)}
                    className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Resolve Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
