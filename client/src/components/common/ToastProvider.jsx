"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toastConfig } from "@/src/utils/toast";

export default function ToastProvider({ children }) {
  return (
    <>
      {children}
      <ToastContainer
        position={toastConfig.position}
        autoClose={toastConfig.autoClose}
        hideProgressBar={toastConfig.hideProgressBar}
        newestOnTop={toastConfig.newestOnTop}
        closeOnClick={toastConfig.closeOnClick}
        rtl={toastConfig.rtl}
        pauseOnFocusLoss={toastConfig.pauseOnFocusLoss}
        draggable={toastConfig.draggable}
        pauseOnHover={toastConfig.pauseOnHover}
        theme={toastConfig.theme}
        toastStyle={toastConfig.style}
        className="toast-container"
        toastClassName="toast-message"
        bodyClassName="toast-body"
        progressClassName="toast-progress"
        limit={5} // Limit to 5 toasts at once
      />
    </>
  );
}
