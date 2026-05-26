import { Icon } from "@iconify/react";
import Button from "./Button";

export default function ServiceCard({
  name,
  image = "/images/hero.png",
  onFavorite,
  isFavorite,
  link,
  description,
  buttonText = "More Details",
}) {
  const handleCardClick = () => {
    if (link) {
      window.location.href = link;
    }
  };

  // Function to truncate description to max 10-12 words
  const getTruncatedDescription = (text) => {
    const fallbackText =
      "Lorem ipsum dolor sit amet consectetur ornare sed euismod malesuada...";
    const targetText = text || fallbackText;
    const words = targetText.split(" ");

    if (words.length <= 12) {
      return targetText;
    }

    return words.slice(0, 10).join(" ") + "...";
  };

  return (
    <div className="relative w-full h-[450px] bg-gray-200 rounded-2xl p-4 group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Background image - normal state */}
      <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300">
        <img
          src={image}
          alt="Service illustration"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>

      {/* Background image - hover state (blurred) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <img
          src={image}
          alt="Service illustration"
          className="w-full h-full object-cover filter blur-lg"
        />
        {/* Dark overlay for hover state text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      </div>

      {/* Heart icon */}
      <button
        className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center cursor-pointer bg-white rounded-full z-10"
        onClick={(e) => {
          e.stopPropagation();
          onFavorite && onFavorite();
        }}
        aria-label={isFavorite ? "Unfavorite" : "Favorite"}
      >
        <Icon
          icon={isFavorite ? "solar:heart-bold" : "solar:heart-linear"}
          width={24}
          className={isFavorite ? "text-red-500" : "text-gray-700"}
        />
      </button>

      {/* Normal state - only title and arrow */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4  justify-start z-10 group-hover:opacity-0 transition-opacity duration-300">
        <h3 className="text-lg font-medium text-white max-w-[180px] drop-shadow-lg">
          {name}
        </h3>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-brand-gray-light">
          <Icon
            icon="solar:arrow-right-up-linear"
            width={20}
            className="text-primary"
          />
        </div>
      </div>

      {/* Hover state - title, description, and button */}
      <div className="absolute inset-4 flex flex-col justify-end z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 space-y-4">
        {/* Title */}
        <h3 className="text-xl font-semibold text-white drop-shadow-lg">
          {name}
        </h3>

        {/* Description - limited to 2 lines and 10-12 words */}
        <p className="text-sm text-white leading-relaxed line-clamp-2 drop-shadow-md">
          {getTruncatedDescription(description)}
        </p>

        {/* Button */}
        <Button
          text={buttonText}
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        />
      </div>
    </div>
  );
}
