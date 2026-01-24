import type { GuideContent } from "../../components/PageGuide";

export const GUIDE_CONTENT: Record<string, GuideContent> = {
  home: {
    title: "Pet Matcher: Product & Breed Quiz",
    sections: [
      {
        heading: "Product Matching",
        content: "Turn uncertainty into sales with the product matching system. Match pets to products based on breed, weight, and age.",
      },
      {
        heading: "Auto-Sync",
        content: "Our system automatically syncs with your catalog using Bulk Operations to ensure recommendations are always up-to-date.",
      },
    ],
  },
  dashboard: {
    title: "Dashboard Guide",
    sections: [
      {
        heading: "Analytics Overview",
        content: "Track how many matches are being made in real-time and see which pet types are most popular among your customers.",
      },
      {
        heading: "Match Events",
        content: "The recent events table shows the latest successful matches made through your storefront.",
      },
    ],
  },
  petTypes: {
    title: "Pet Types Guide",
    sections: [
      {
        heading: "Configuring Categories",
        content: "Define the types of pets your store supports (e.g., Dogs, Cats, Birds). You can add breeds and other attributes for each type.",
      },
    ],
  },
  rules: {
    title: "Matching Rules",
    sections: [
      {
        heading: "Smart Breed Matching",
        content: "Create rules that match products to 200+ breeds, specific weights, and age ranges to boost AOV.",
      },
      {
        heading: "Accurate Matching",
        content: "Ensure every customer finds the right product, reducing returns and building trust.",
      },
    ],
  },
  settings: {
    title: "Settings Guide",
    sections: [
      {
        heading: "App Configuration",
        content: "Manage your shop details and global app preferences here.",
      },
    ],
  },
  petProfiles: {
    title: "Pet Profile System",
    sections: [
      {
        heading: "Birthday Marketing",
        content: "Capture birthdays and 'Gotcha Days' to power personalized retention marketing and boost customer loyalty.",
      },
      {
        heading: "Personalization Data",
        content: "Deep insights into your customers' pets, allowing you to provide a truly tailored shopping experience.",
      },
    ],
  },
  billing: {
    title: "Plans & Billing Guide",
    sections: [
      {
        heading: "Subscription Tiers",
        content: "Choose a plan that fits your store's volume. Each tier increases your monthly match token limit and unlocks advanced features like Klaviyo integration.",
      },
      {
        heading: "Match Tokens",
        content: "Tokens are consumed each time the matching engine successfully recommends products to a customer. Your usage resets at the start of your billing cycle.",
      },
    ],
  },
};
