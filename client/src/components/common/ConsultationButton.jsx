"use client";
import Button from "./Button";
import { useBookMeetModal } from "../../hooks/useBookMeetModal";

const ConsultationButton = ({
  text = "Schedule Consultation",
  type = "primary",
  className = "",
  ...props
}) => {
  const { openModal } = useBookMeetModal();

  return (
    <Button
      text={text}
      type={type}
      className={className}
      onClick={openModal}
      {...props}
    />
  );
};

export default ConsultationButton;
