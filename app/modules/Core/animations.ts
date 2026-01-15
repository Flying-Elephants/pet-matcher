import { type Variants } from "framer-motion";

export const FADE_IN_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  }
};

export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

export const STAGGER_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  }
};

export const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1
};
