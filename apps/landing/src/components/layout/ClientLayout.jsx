"use client";

import BookMeetModal from "../common/BookMeetModal";
import { useBookMeetModal } from "../../hooks/useBookMeetModal";

export default function ClientLayout({ children }) {
  const { isOpen, closeModal } = useBookMeetModal();

  return (
    <>
      {children}
      <BookMeetModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
}
