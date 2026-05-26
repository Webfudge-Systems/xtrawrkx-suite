import Image from "next/image";
import Button from "./Button";
import Container from "../layout/Container";
import Section from "../layout/Section";

export default function Hero({
  title,
  description,
  backgroundImage = "/images/hero.jpg",
  showButton = false,
  buttonText = "Click Here",
  buttonLink = "#",
}) {
  return (
    <Section className="relative w-full h-[40vh] md:h-[80vh] md:min-h-[500px] flex items-center justify-center text-center md:justify-start md:text-left overflow-hidden p-0">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={backgroundImage}
          alt="Hero background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay for text readability */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.0) 25%)",
          }}
        />
      </div>

      {/* Content */}
      <Container className="relative z-20 flex flex-col items-center md:items-start px-4 md:px-8">
        <h1 className="text-white text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-lg max-w-3xl">
          {title}
        </h1>
        <p className="md:block hidden text-gray-200 text-lg md:text-xl max-w-2xl mb-8 font-light drop-shadow">
          {description}
        </p>
        {showButton && (
          <Button
            link={buttonLink}
            text={buttonText}
            type="primary"
            className="w-fit"
          />
        )}
      </Container>
    </Section>
  );
}
