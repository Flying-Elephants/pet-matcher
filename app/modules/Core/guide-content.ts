import type { GuideContent } from "../../components/PageGuide";

export const GUIDE_CONTENT: Record<string, GuideContent> = {
  home: {
    title: "Welcome to Pet-Matcher",
    sections: [
      {
        heading: "Overview",
        content: "Pet-Matcher helps you provide personalized product recommendations based on your customers' pets.",
      },
      {
        heading: "Getting Started",
        content: "Start by configuring your Pet Types and then create Product Rules to link products to specific pet attributes.",
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
    title: "Product Rules Guide",
    sections: [
      {
        heading: "Creating Rules",
        content: "Rules determine which products are shown to which pets. You can match by breed, age, or specific pet needs.",
      },
      {
        heading: "Rule Priority",
        content: "If multiple rules match, the most specific rule will take precedence.",
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
};
