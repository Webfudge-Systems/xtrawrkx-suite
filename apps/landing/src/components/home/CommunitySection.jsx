"use client";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import { motion } from "framer-motion";

// Floating animation variants for continuous motion
const floatingVariants1 = {
  float: {
    y: [0, -12, 0],
    rotate: [0, 2, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const floatingVariants2 = {
  float: {
    y: [0, 8, 0],
    rotate: [0, -1.5, 0],
    transition: {
      duration: 3.2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.3,
    },
  },
};

const floatingVariants3 = {
  float: {
    y: [0, -10, 0],
    rotate: [0, 1.5, 0],
    transition: {
      duration: 4.8,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.6,
    },
  },
};

const floatingVariants4 = {
  float: {
    y: [0, 10, 0],
    rotate: [0, -2, 0],
    transition: {
      duration: 3.6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.2,
    },
  },
};

const floatingVariants5 = {
  float: {
    y: [0, -8, 0],
    rotate: [0, 1, 0],
    transition: {
      duration: 4.2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.8,
    },
  },
};

const floatingVariants6 = {
  float: {
    y: [0, 14, 0],
    rotate: [0, -1.8, 0],
    transition: {
      duration: 3.8,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.4,
    },
  },
};

const images = [
  {
    src: "/images/community/2.png",
    className: "-left-16 top-16 w-46 h-56 rounded-2xl",
    delay: 0.2,
    floatingVariant: floatingVariants1,
  },
  {
    src: "/images/community/1.png",
    className: "left-24 -top-16 w-20 h-28 rounded-xl",
    delay: 0.4,
    floatingVariant: floatingVariants2,
  },
  {
    src: "/images/community/3.png",
    className: "left-10 bottom-12 w-48 h-60 rounded-3xl",
    delay: 0.6,
    floatingVariant: floatingVariants3,
  },
  {
    src: "/images/community/4.png",
    className: "-right-16 top-16 w-46 h-56 rounded-2xl",
    delay: 0.3,
    floatingVariant: floatingVariants4,
  },
  {
    src: "/images/community/5.png",
    className: "right-24 -top-16 w-20 h-28 rounded-xl",
    delay: 0.5,
    floatingVariant: floatingVariants5,
  },
  {
    src: "/images/community/6.png",
    className: "right-10 bottom-12 w-48 h-60 rounded-3xl",
    delay: 0.7,
    floatingVariant: floatingVariants6,
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const backgroundVariants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: "easeOut",
    },
  },
};

const imageVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -10,
  },
  visible: (delay) => ({
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      delay,
      duration: 0.8,
      ease: "easeOut",
      type: "spring",
      bounce: 0.4,
    },
  }),
  hover: {
    scale: 1.05,
    rotate: 2,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const textVariants = {
  hidden: {
    y: 50,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const buttonVariants = {
  hidden: {
    y: 30,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      delay: 0.8,
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const mobileGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.15,
    },
  },
};

const mobileImageVariants = {
  hidden: {
    scale: 0.6,
    opacity: 0,
    y: 20,
  },
  visible: (delay = 0) => ({
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

export default function CommunitySection() {
  return (
    <Section className="my-24 md:my-48 md:mt-[300px] overflow-visible py-20 md:py-0 min-h-[500px] md:min-h-auto">
      <Container className="relative">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 sm:w-80 sm:h-80 md:w-[68rem] md:h-[68rem] opacity-20 md:opacity-40 bg-radial from-white via-primary/50 to-white blur-3xl rounded-full z-0"
          variants={backgroundVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        />

        {/* Desktop Floating images */}
        {images.map((img, i) => (
          <motion.div
            key={i}
            className={`absolute z-10 ${img.className} hidden lg:block`}
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true, amount: 0.3 }}
            custom={img.delay}
          >
            <motion.div
              className="w-full h-full"
              variants={img.floatingVariant}
              animate="float"
            >
              <Image
                src={img.src}
                alt="Community member"
                fill
                className="object-cover rounded-2xl shadow-lg"
                sizes="(max-width: 768px) 380px, 380px"
              />
            </motion.div>
          </motion.div>
        ))}

        {/* Mobile decorative images - Semi-transparent frosted glass cards */}
        <motion.div
          className="lg:hidden absolute inset-0 z-10"
          variants={mobileGridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="relative w-full h-full px-4 py-12">
            {/* Top left card */}
            <motion.div
              className="absolute top-8 left-4 w-24 h-32 rounded-2xl overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-lg"
              variants={mobileImageVariants}
              style={{ zIndex: 1 }}
            >
              <Image
                src="/images/community/1.png"
                alt="Community"
                fill
                className="object-cover blur-sm"
                sizes="96px"
              />
            </motion.div>

            {/* Top center card */}
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-36 rounded-2xl overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-lg"
              variants={mobileImageVariants}
              custom={0.1}
              style={{ zIndex: 2 }}
            >
              <Image
                src="/images/community/2.png"
                alt="Community"
                fill
                className="object-cover blur-sm"
                sizes="112px"
              />
            </motion.div>

            {/* Top right card */}
            <motion.div
              className="absolute top-12 right-4 w-20 h-28 rounded-xl overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-lg"
              variants={mobileImageVariants}
              custom={0.2}
              style={{ zIndex: 1 }}
            >
              <Image
                src="/images/community/3.png"
                alt="Community"
                fill
                className="object-cover blur-sm"
                sizes="80px"
              />
            </motion.div>

            {/* Bottom left card */}
            <motion.div
              className="absolute bottom-16 left-6 w-28 h-36 rounded-2xl overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-lg"
              variants={mobileImageVariants}
              custom={0.3}
              style={{ zIndex: 1 }}
            >
              <Image
                src="/images/community/4.png"
                alt="Community"
                fill
                className="object-cover blur-sm"
                sizes="112px"
              />
            </motion.div>

            {/* Bottom right card */}
            <motion.div
              className="absolute bottom-20 right-6 w-24 h-32 rounded-2xl overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-lg"
              variants={mobileImageVariants}
              custom={0.4}
              style={{ zIndex: 1 }}
            >
              <Image
                src="/images/community/5.png"
                alt="Community"
                fill
                className="object-cover blur-sm"
                sizes="96px"
              />
            </motion.div>

            {/* Center card (behind text) */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 rounded-3xl overflow-hidden backdrop-blur-md bg-white/15 border border-white/25 shadow-lg"
              variants={mobileImageVariants}
              custom={0.5}
              style={{ zIndex: 0 }}
            >
              <Image
                src="/images/community/6.png"
                alt="Community"
                fill
                className="object-cover blur-sm"
                sizes="128px"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Centered content */}
        <motion.div
          className="relative z-20 flex flex-col items-center justify-center text-center px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2
            className="text-[50px] md:text-5xl lg:text-8xl font-extrabold text-gray-900 mb-8 md:mb-8 leading-tight px-4 md:normal-case uppercase"
            variants={textVariants}
          >
            <span className="hidden md:block">
              {" "}
              Meet <br />
              those who <br />
              make our <br />
              <span className="text-primary">Community</span>
            </span>
            <span className="block md:hidden">
              {" "}
              <span className="text-[42px]">
                Meet those <br />
                who make our
              </span>{" "}
              <br />
              <span className="text-primary text-[55px]">Community</span>
            </span>
          </motion.h2>
          <motion.div
            variants={buttonVariants}
            className="w-full max-w-xs px-4"
          >
            <Button
              type="secondary"
              text="Explore The Communities"
              className="mt-2 w-full"
              link="/communities"
            />
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}
