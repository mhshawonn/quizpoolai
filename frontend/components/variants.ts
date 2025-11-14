// Shared animation snippets for springy Duolingo-style entrances.
export const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 700, damping: 30 }
  }
};
