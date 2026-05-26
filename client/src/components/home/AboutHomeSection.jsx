"use client";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Image from "next/image";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.2,
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
      duration: 1,
      ease: "easeOut",
    },
  },
};

const imageVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -15,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      type: "spring",
      bounce: 0.3,
    },
  },
};

const floatingVariants = {
  float: {
    y: [0, -10, 0],
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
      duration: 3.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.5,
    },
  },
};

const floatingVariants3 = {
  float: {
    y: [0, -6, 0],
    rotate: [0, 1, 0],
    transition: {
      duration: 4.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1,
    },
  },
};

const decorativeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: [0.3, 0.2, 0.4],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
};

const cloudVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 1.5,
      duration: 1,
    },
  },
};

export default function AboutHomeSection() {
  return (
    <Section className="hidden relative bg-[#E3E3E3] min-h-[80vh] md:min-h-[110vh] md:flex items-center justify-center py-12 md:py-20">
      <Container>
        {/* Main text */}
        <motion.div
          className="relative z-20 flex flex-col items-center justify-center text-center min-h-[280px] md:min-h-[340px] px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p
            className="text-base sm:text-lg md:text-3xl lg:text-5xl font-extralight text-gray-900 max-w-6xl mx-auto leading-relaxed"
            variants={textVariants}
          >
            At Xtrawrkx, we solve{" "}
            <span className="font-medium">
              Xtra-tough{" "}
              <span className="hidden sm:inline">
                <br />
              </span>
              challenges
            </span>{" "}
            with <span className="font-medium">smart, strategic Wrkx</span>.
            <br />
            From <span className="font-medium">Consulting</span> to{" "}
            <span className="font-medium">Electric Vehicles</span> —
            <span className="hidden md:inline">
              <br />
            </span>
            we bring{" "}
            <span className="hidden md:inline">
              &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
              &nbsp;
            </span>{" "}
            the <span className="font-medium">spark</span>.
          </motion.p>

          {/* Images - Hidden on mobile for cleaner layout */}
          <div className="hidden sm:block">
            {/* Top-left image */}
            <motion.div
              className="absolute -left-6 md:-left-10 -top-6 md:-top-12 w-28 h-20 md:w-40 md:h-28 lg:w-56 lg:h-38 z-10"
              variants={imageVariants}
              animate="float"
              custom={floatingVariants}
            >
              <motion.div
                className="w-full h-full"
                variants={floatingVariants}
                animate="float"
              >
                <Image
                  src="/images/about/5.JPG"
                  alt="Team group 1"
                  fill
                  className="object-cover rounded-md shadow-lg"
                  style={{ objectPosition: "center" }}
                />
              </motion.div>
            </motion.div>
            {/* Top-right image */}
            <motion.div
              className="absolute -right-20 md:-right-32 top-12 md:top-20 w-28 h-20 md:w-40 md:h-28 lg:w-56 lg:h-42 z-10"
              variants={imageVariants}
            >
              <motion.div
                className="w-full h-full"
                variants={floatingVariants2}
                animate="float"
              >
                <Image
                  src="/images/about/2.png"
                  alt="Team group 2"
                  fill
                  className="object-cover rounded-md shadow-lg"
                  style={{ objectPosition: "center" }}
                />
              </motion.div>
            </motion.div>
            {/* Bottom-center image */}
            <motion.div
              className="absolute left-1/2 -bottom-20 md:-bottom-30 transform -translate-x-1/2 w-28 h-20 md:w-40 md:h-28 lg:w-56 lg:h-46 z-10"
              variants={imageVariants}
            >
              <motion.div
                className="w-full h-full"
                variants={floatingVariants3}
                animate="float"
              >
                <Image
                  src="/images/about/3.jpg"
                  alt="Panel discussion"
                  fill
                  className="object-cover rounded-md shadow-lg"
                  style={{ objectPosition: "center" }}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Mobile-only decorative elements */}
          <motion.div
            className="sm:hidden absolute inset-0 pointer-events-none"
            variants={containerVariants}
          >
            {/* Simple decorative shapes for mobile */}
            <motion.div
              className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full opacity-30"
              variants={decorativeVariants}
            ></motion.div>
            <motion.div
              className="absolute bottom-8 right-6 w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full opacity-20"
              variants={decorativeVariants}
            ></motion.div>
            <motion.div
              className="absolute top-1/2 right-2 w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-40"
              variants={decorativeVariants}
            ></motion.div>
          </motion.div>
        </motion.div>

        {/* Cloud effect at bottom */}
        <motion.div
          className="absolute left-0 right-0 bottom-0 h-16 md:h-24 lg:h-32 bg-gradient-to-t from-[#f5f5f5] to-transparent pointer-events-none"
          style={{ zIndex: 5 }}
          variants={cloudVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        />
      </Container>
    </Section>
  );
}
