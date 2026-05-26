import React from "react";

export default function SectionHeader({ label, title, className }) {
  return (
    <div className={`mb-6 w-[100%] ${className}`}>
      <div className="text-brand-primary uppercase text-lg font-medium mb-3 tracking-wider">
        {label}
      </div>
      <h2 className="text-3xl md:text-5xl font-extrabold text-[#262626] w-full">
        {title}
      </h2>
    </div>
  );
}
