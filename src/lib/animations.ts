import { type Variants } from "framer-motion";

// Configuration for consistent spring/tween behavior
const easeOut: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: easeOut 
    } 
  },
};

export const fadeIn: Variants = {
  hidden: { 
    opacity: 0, 
  },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.8, 
      ease: easeOut 
    } 
  },
};

// Standard viewport configuration for consistent trigger behavior
export const standardViewport = { once: true, margin: "-100px" };
