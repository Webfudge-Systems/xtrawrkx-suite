import Section from "../layout/Section";
import Button from "../common/Button";
import { Icon } from "@iconify/react";
import { useBookMeetModal } from "../../hooks/useBookMeetModal";

export default function HomeHero() {
  const { openModal } = useBookMeetModal();

  return (
    <Section className="relative bg-[#E3E3E3] w-full h-[100vh] min-h-[600px] md:h-[105vh] md:min-h-[700px] flex flex-col items-center justify-center !overflow-x-hidden p-0">
      {/* Background video */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* Mobile video */}
        <video
          src="/mountain_vid1.webm"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-top md:hidden"
        />
        {/* Desktop video */}
        <video
          src="/mountain_hero.webm"
          autoPlay
          muted
          loop
          playsInline
          className="hidden md:block w-full h-full object-cover object-top"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#E3E3E3] via-[#E3E3E3]/0 to-transparent"></div>
      </div>

      {/* GROW text - Mobile only */}
      <div className="md:hidden absolute top-30 left-0 right-0 z-10 flex flex-col items-center justify-center ">
        <h1 className="text-[135px] font-extrabold tracking-tighter bg-gradient-to-b from-white via-white/70 to-transparent bg-clip-text text-transparent text-center leading-tight drop-shadow-lg">
          GROW
        </h1>
        <h1 className="text-[70px] font-extrabold tracking-tight bg-gradient-to-b from-white via-white/70 to-transparent bg-clip-text text-transparent text-center leading-tight drop-shadow-lg -mt-8">
          TOGETHER
        </h1>
      </div>

      {/* Main content area - centered for subtitle */}
      <div
        className="
          z-30 flex flex-col items-center justify-center w-full max-w-3xl px-4 -mb-[50px]
          !static md:!absolute md:bottom-20 md:left-1/2 md:-translate-x-1/2 md:justify-start md:mb-0
        "
        style={{
          position: "static",
        }}
      >
        <div className=" hidden md:block text-dark text-center mb-6 md:mb-2 font-heading font-extralight text-xl sm:text-2xl md:text-4xl lg:text-5xl max-w-5xl leading-tight">
          <p>From Complexity to Clarity</p>
          <p>We help "you" build what matters.</p>
        </div>
        <div className="hidden md:block mt-4">
          <Button
            text="Book Consultation"
            type="primary"
            onClick={openModal}
          />
        </div>
      </div>

      {/* Action cards at bottom - Hidden on mobile for better UX */}
      <div className="hidden md:block absolute bottom-20 left-0 right-0 z-20 px-4">
        <div className="w-[95%] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left cards */}
          <div className="relative flex w-full md:w-[26%] min-h-[220px]">
            {/* Business Advisory and Consulting card (upper left) */}
            <div
              className="absolute left-0 cursor-pointer -top-10 bg-gradient-to-b from-[#BDBDBD]/90 to-[#E3E3E3]/80 rounded-2xl shadow-md w-[180px] h-[220px] flex flex-col justify-between items-center p-4 border border-white/40"
              style={{ zIndex: 10 }}
              onClick={() => {
                window.location.href = "/services";
              }}
            >
              <div className="flex flex-col items-center justify-center flex-1">
                <div
                  className="text-white text-base font-bold text-center leading-tight mb-2 drop-shadow-sm"
                  style={{ opacity: 0.95 }}
                >
                  Business
                  <br />
                  Advisory and
                  <br />
                  Consulting
                </div>
              </div>
              <button className="mt-2 w-full bg-white rounded-full px-4 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1 border border-gray-200 shadow-sm hover:bg-gray-100 transition">
                Read More
                <span className="ml-1 text-base">
                  <Icon
                    icon="ic:round-arrow-forward"
                    className="text-gray-700"
                  />
                </span>
              </button>
            </div>
            {/* Financial Analysis and Reporting card (lower right, slightly to the right and down) */}
            <div
              className="absolute right-0 bottom-0 cursor-pointer bg-gradient-to-b from-[#E3E3E3]/90 to-[#BDBDBD]/80 rounded-2xl shadow-md w-[180px] h-[220px] flex flex-col justify-between items-center p-4 border border-white/40"
              style={{ zIndex: 20 }}
              onClick={() => {
                window.location.href = "/services";
              }}
            >
              <div className="flex flex-col items-center justify-center flex-1">
                <div
                  className="text-white text-base font-bold text-center leading-tight mb-2 drop-shadow-sm"
                  style={{ opacity: 0.95 }}
                >
                  Financial
                  <br />
                  Analysis and
                  <br />
                  Reporting
                </div>
              </div>
              <button className="mt-2 w-full bg-white rounded-full px-4 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1 border border-gray-200 shadow-sm hover:bg-gray-100 transition">
                Read More
                <span className="ml-1 text-base">
                  <Icon
                    icon="ic:round-arrow-forward"
                    className="text-gray-700"
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Right cards */}
          <div className="relative flex w-full md:w-[26%] min-h-[220px]">
            {/* Contract Manufacturing card (lower left) */}
            <div
              className="absolute left-0 bottom-0 cursor-pointer bg-gradient-to-b from-[#E3E3E3]/80 to-[#BDBDBD]/80 rounded-2xl shadow-md w-[180px] h-[220px] flex flex-col justify-between items-center p-4 border border-white/40"
              style={{ zIndex: 10 }}
              onClick={() => {
                window.location.href = "/services";
              }}
            >
              <div className="flex flex-col items-center justify-center flex-1">
                <div
                  className="text-white text-base font-bold text-center leading-tight mb-1 drop-shadow-sm"
                  style={{ opacity: 0.85 }}
                >
                  Contract
                  <br />
                  Manufacturing
                </div>
              </div>
              <button className="mt-2 w-full bg-white rounded-full px-4 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1 border border-gray-200 shadow-sm hover:bg-gray-100 transition">
                Read More
                <span className="ml-1 text-base">
                  <Icon
                    icon="ic:round-arrow-forward"
                    className="text-gray-700"
                  />
                </span>
              </button>
            </div>
            {/* Management Consulting card (upper right) */}
            <div
              className="absolute right-0 -top-10 cursor-pointer bg-gradient-to-b from-[#A6A6A6]/80 to-[#E3E3E3]/80 rounded-2xl shadow-md w-[180px] h-[220px] flex flex-col justify-between items-center p-4 border border-white/40"
              style={{ zIndex: 20 }}
              onClick={() => {
                window.location.href = "/services";
              }}
            >
              <div className="flex flex-col items-center justify-center flex-1">
                <div
                  className="text-white text-base font-bold text-center leading-tight mb-1 drop-shadow-sm"
                  style={{ opacity: 0.85 }}
                >
                  Management
                  <br />
                  Consulting
                </div>
              </div>
              <button className="mt-2 w-full bg-white rounded-full px-4 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1 border border-gray-200 shadow-sm hover:bg-gray-100 transition">
                Read More
                <span className="ml-1 text-base">
                  <Icon
                    icon="ic:round-arrow-forward"
                    className="text-gray-700"
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Service Cards - Simplified layout for mobile */}
      <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-4">
        <div className="grid grid-cols-2 h-[280px] gap-3 max-w-sm mx-auto">
          <div className="bg-gradient-to-b from-[#BDBDBD]/90 to-[#E3E3E3]/80 rounded-xl shadow-md p-3 border border-white/40 flex flex-col justify-between items-center">
            <div className="text-white text-lg font-bold text-center leading-tight mb-2">
              Business Advisory
            </div>
            <button className="w-full bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1">
              Learn More
            </button>
          </div>
          <div className="bg-gradient-to-b from-[#E3E3E3]/90 to-[#BDBDBD]/80 rounded-xl shadow-md p-3 border border-white/40 flex flex-col justify-between items-center">
            <div className="text-white text-lg font-bold text-center leading-tight mb-2">
              Financial Analysis
            </div>
            <button className="w-full bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1">
              Learn More
            </button>
          </div>
          <div className="bg-gradient-to-b from-[#E3E3E3]/80 to-[#BDBDBD]/80 rounded-xl shadow-md p-3 border border-white/40 flex flex-col justify-between items-center">
            <div className="text-white text-lg font-bold text-center leading-tight mb-2">
              Manufacturing
            </div>
            <button className="w-full bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1">
              Learn More
            </button>
          </div>
          <div className="bg-gradient-to-b from-[#A6A6A6]/80 to-[#E3E3E3]/80 rounded-xl shadow-md p-3 border border-white/40 flex flex-col justify-between items-center">
            <div className="text-white text-lg font-bold text-center leading-tight mb-2">
              Management
            </div>
            <button className="w-full bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-800 flex items-center justify-center gap-1">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
