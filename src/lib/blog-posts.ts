// Blog posts (mykuchupuchu.com/blog/<slug>). A plain module: the server uses it for metadata and
// structured data, the page shows it. Facts about other apps come from their store listings and
// official pages (checked on the date in `factsChecked`); keep them general where sources differ.

export type BlogApp = {
  rank: number;
  name: string;
  id: string;            // anchor on the page
  bestFor: string;
  ages: string;
  cost: string;
  postsVideos: string;   // can kids post their own videos?
  chat: string;          // can kids talk to others?
  platforms: string;
  summary: string[];     // paragraphs
  highlights: string[];
  goodToKnow: string[];
  links: { label: string; url: string; own?: boolean }[];
};

export type BlogPost = {
  slug: string;
  topic: string;         // used in headings: "The 8 Best <topic> at a Glance", "<topic>: FAQ"
  crumb: string;         // short breadcrumb label
  title: string;         // <title>
  description: string;   // meta description
  h1: string;
  published: string;     // ISO date
  updated: string;
  factsChecked: string;  // human date
  readMinutes: number;
  image: string;
  imageAlt: string;
  excerpt: string;
  quickAnswer: string;
  intro: string[];
  disclosure: string;
  howWeChose: { title: string; text: string }[];
  apps: BlogApp[];
  tips: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
  related: { label: string; path: string }[];
};

const PLAY = "https://play.google.com/store/apps/details?id=kuchupuchu.com";
const APPLE = "https://apps.apple.com/us/app/kuchu-puchu-videos-for-kids/id6830569072";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "apps-for-kids-like-tiktok",
    topic: "Apps for Kids Like TikTok",
    crumb: "Apps for kids like TikTok",
    title: "Top 8 Safe Apps for Kids Like TikTok in 2026 | Kuchu Puchu",
    description: "Looking for a safe TikTok for kids? Compare the top 8 kid-friendly video apps of 2026, led by Kuchu Puchu: free, no ads, made for ages 3–8.",
    h1: "Top 8 Apps for Kids Like TikTok: Safe Alternatives for 2026",
    published: "2026-11-18",
    updated: "2026-11-18",
    factsChecked: "18 November 2026",
    readMinutes: 9,
    image: "/images/illus-phone.webp",
    imageAlt: "A phone showing a kids video app with cartoon animal videos",
    excerpt: "Kids love short, swipeable videos, but TikTok is for ages 13 and up. Here are 8 safer apps for kids like TikTok, compared by age, cost and safety.",
    quickAnswer: "The best app for kids like TikTok is Kuchu Puchu for children aged 3–8: a free, ad-free short video app with no comments and no sign-up for kids, on Android and iPhone. Other safe options are YouTube Kids (big library), Zigazoo (kids make videos), PBS KIDS Video, Kidoodle.TV, Khan Academy Kids, Coverstar (for tweens 9+) and Kinzoo (family video messages).",
    intro: [
      "Kids love what makes TikTok fun: short, colorful videos you can swipe through. But TikTok's own rules say users must be at least 13, and its open comments, messages and endless feed are not built for young children.",
      "The good news: there are apps for kids like TikTok that keep the fun of short videos and leave out the risks. Some only let kids watch videos made for their age, some let older kids create safely, and some focus on learning. Below are the 8 best options in 2026, with what each one costs, who it is for and what to watch out for.",
    ],
    disclosure: "Kuchu Puchu is our app, so we put it first. We checked the facts about every other app on this list from their own store pages and websites, and we tell you what each one is good at, including where another app may suit your family better.",
    howWeChose: [
      { title: "Made for kids", text: "Videos or tools designed for children, not a grown-up app with a kids filter added later." },
      { title: "No strangers", text: "No private messages with people kids don't know, and no open comment sections for young kids." },
      { title: "Ads and costs", text: "Whether there are ads or paid extras, so you know what your child will see and what you may pay." },
      { title: "Parent controls", text: "Ways for grown-ups to manage languages, timers, reports or contacts." },
    ],
    apps: [
      {
        rank: 1, id: "kuchu-puchu", name: "Kuchu Puchu",
        bestFor: "Short learning videos for ages 3–8",
        ages: "3–8", cost: "Free, no ads", postsVideos: "No (watch only)", chat: "No comments or chat",
        platforms: "Android, iPhone, web",
        summary: [
          "Kuchu Puchu is the closest thing to a TikTok made for little kids. The app opens straight into a swipe-to-watch feed of short videos: funny cartoons, nursery rhymes, poems, stories, ABC and counting videos, animals and good habits. Every video is made for children aged 3 to 8.",
          "Unlike open video apps, every Kuchu Puchu creator is approved by the team and videos are reviewed before they go live. Kids can't post, comment or chat, so strangers can't reach them. Videos come in Hindi, English, Punjabi, Haryanvi, Urdu and more, and a grown-up can choose which languages to show.",
        ],
        highlights: [
          "Free, with no ads and nothing to buy",
          "Short videos that help kids learn ABCs, counting, colors, shapes, names, rhymes and good habits",
          "No comments, no chat and no account needed for kids",
          "Grown-ups area behind a check: languages, reports and outside links",
          "No advertising IDs or tracking tools",
        ],
        goodToKnow: [
          "Kuchu Puchu is a new app, so its video library is still growing.",
          "It's built for ages 3–8; older kids may prefer YouTube Kids or Zigazoo.",
        ],
        links: [
          { label: "Get it on Google Play", url: PLAY, own: true },
          { label: "Download on the App Store", url: APPLE, own: true },
          { label: "Watch free on the website", url: "https://mykuchupuchu.com/", own: true },
        ],
      },
      {
        rank: 2, id: "youtube-kids", name: "YouTube Kids",
        bestFor: "A very large library of kids videos",
        ages: "Up to 12", cost: "Free with limited ads", postsVideos: "No", chat: "No",
        platforms: "Android, iOS, web, TVs",
        summary: [
          "YouTube Kids is Google's separate app for children, with a huge choice of shows, music and learning videos. Parents pick a content setting by age: Preschool (4 and under), Younger (5–8) or Older (9–12).",
          "The free app shows limited ads, with personalized ads turned off for kids; YouTube Premium removes them. Parents can set a timer, turn off search, block channels and look back at what was watched.",
        ],
        highlights: ["Age-based content settings", "Timer and search on/off", "Block channels and review watch history"],
        goodToKnow: [
          "Videos are mostly filtered automatically, so the odd unsuitable video can slip through; check the watch history.",
          "Autoplay makes it easy to keep watching, so the timer helps.",
        ],
        links: [{ label: "YouTube Kids", url: "https://www.youtubekids.com/" }],
      },
      {
        rank: 3, id: "zigazoo", name: "Zigazoo",
        bestFor: "Kids who want to make their own videos",
        ages: "About 6–12", cost: "Free, optional premium", postsVideos: "Yes, moderated", chat: "No private messages",
        platforms: "iOS, Android",
        summary: [
          "Zigazoo is often called a TikTok for kids because children don't just watch: they record short video answers to fun prompts and challenges from creators, teachers, museums and zoos.",
          "Videos go through moderation before others see them, and there are no private messages. Kids can keep a video private or share it with the community.",
        ],
        highlights: ["Prompt-based video challenges", "Moderated sharing", "No direct messages"],
        goodToKnow: [
          "It's a social app, so talk with your child about what they share and check the privacy settings.",
          "There are paid extras, so keep purchases behind a parent password.",
        ],
        links: [{ label: "Zigazoo", url: "https://www.zigazoo.com/" }],
      },
      {
        rank: 4, id: "pbs-kids-video", name: "PBS KIDS Video",
        bestFor: "Trusted educational TV shows (US)",
        ages: "2–8", cost: "Free", postsVideos: "No", chat: "No",
        platforms: "Android, iOS, TVs",
        summary: [
          "PBS KIDS Video brings free full episodes and clips from well-known PBS KIDS shows, made for ages 2 to 8, with new videos added often and downloads for offline viewing.",
          "There's no subscription. Some full episodes start with short messages from sponsors.",
        ],
        highlights: ["Free full episodes and clips", "Educational shows", "Offline downloads"],
        goodToKnow: ["It works best for families in the United States.", "These are TV episodes and clips, not a short-video feed."],
        links: [{ label: "PBS KIDS Video", url: "https://pbskids.org/apps/pbs-kids-video" }],
      },
      {
        rank: 5, id: "kidoodle-tv", name: "Kidoodle.TV",
        bestFor: "Free kids shows and movies",
        ages: "Kids (rated 4+)", cost: "Free with ads, ad-free option", postsVideos: "No", chat: "No",
        platforms: "Android, iOS, smart TVs, web",
        summary: [
          "Kidoodle.TV is a free streaming app for kids with shows and movies chosen by people, not just an algorithm. It holds a kidSAFE+ COPPA seal.",
          "The free version is supported by ads that are checked for kids, and a paid plan removes them. Parents can switch shows on or off and use a bedtime mode.",
        ],
        highlights: ["Human-curated shows", "Parents can hide shows", "Bedtime mode"],
        goodToKnow: ["The free version has ads.", "Mostly longer shows rather than short clips."],
        links: [{ label: "Kidoodle.TV", url: "https://kidoodle.tv/" }],
      },
      {
        rank: 6, id: "khan-academy-kids", name: "Khan Academy Kids",
        bestFor: "Learning first: reading, math and more",
        ages: "2–8", cost: "Free, no ads", postsVideos: "No", chat: "No",
        platforms: "Android, iOS",
        summary: [
          "Khan Academy Kids is a free learning app from the nonprofit Khan Academy, with games, books, activities and sing-along videos that cover reading, math and early skills.",
          "It is completely free, with no ads and no subscriptions, and much of it works offline.",
        ],
        highlights: ["100% free, no ads", "Reading, math and early learning", "Works offline"],
        goodToKnow: ["It's a learning app, not a swipeable video feed, so it pairs well with a video app."],
        links: [{ label: "Khan Academy Kids", url: "https://learn.khanacademy.org/khan-academy-kids/" }],
      },
      {
        rank: 7, id: "coverstar", name: "Coverstar",
        bestFor: "Tweens (9+) making music and dance videos",
        ages: "9+", cost: "Free to download", postsVideos: "Yes", chat: "Public comments only, no DMs",
        platforms: "iOS, Android",
        summary: [
          "Coverstar is a short-video app for tweens who want to sing, dance and make music videos. It has no direct messages: all interaction is through public comments, which are moderated by people and AI tools.",
          "It's rated 9+, so it suits older siblings rather than preschoolers.",
        ],
        highlights: ["Music and dance video tools", "No direct messages", "Moderated comments"],
        goodToKnow: ["Not for young children.", "Check whether your child's profile is public, and set it up together."],
        links: [{ label: "Coverstar", url: "https://coverstar.app/" }],
      },
      {
        rank: 8, id: "kinzoo", name: "Kinzoo",
        bestFor: "Family video messages",
        ages: "All ages, parent-approved", cost: "Free, in-app purchases", postsVideos: "Video messages to family", chat: "Parent-approved contacts only",
        platforms: "iOS, Android",
        summary: [
          "Kinzoo isn't a video feed, but it gives kids the fun of sending short videos to the people who matter. It's a family messenger where parents approve every contact, with short video messages, photos and calls.",
          "It's a good choice if your child wants to make videos for grandparents and friends you know, not for strangers.",
        ],
        highlights: ["Parents approve every contact", "Short video messages and calls", "Private profiles"],
        goodToKnow: ["It's a messenger, not a place to watch videos.", "Stickers and filters can cost money."],
        links: [{ label: "Kinzoo", url: "https://www.kinzoo.com/" }],
      },
    ],
    tips: [
      { title: "Watch together first", text: "Spend the first few sessions watching with your child. You'll learn what they like and spot anything you're not happy with." },
      { title: "Set a simple limit", text: "Agree on a number of videos or a time before you start, and give a gentle warning before the end." },
      { title: "Keep the settings with grown-ups", text: "Use parent passwords, grown-up checks and timers, and keep purchases locked." },
      { title: "Choose no-ads apps for little ones", text: "Young children can't always tell an ad from a video. For ages 3–8, an ad-free app like Kuchu Puchu or Khan Academy Kids keeps it simple." },
      { title: "Talk about strangers", text: "If your child uses an app where they can post, explain why we don't share our name, school or face with people we don't know." },
    ],
    faqs: [
      { q: "What is the best app for kids like TikTok?", a: "For children aged 3–8, Kuchu Puchu is the best app like TikTok: short, funny learning videos in a swipeable feed, free with no ads, no comments and no sign-up for kids. For a bigger library try YouTube Kids, and for kids who want to make their own videos try Zigazoo or, for tweens 9+, Coverstar." },
      { q: "Is there a kids version of TikTok?", a: "No. TikTok's own rules say users must be at least 13, and there is no separate TikTok app for young children. Parents of younger kids use safe alternatives such as Kuchu Puchu, YouTube Kids or Zigazoo instead." },
      { q: "Is Kuchu Puchu free?", a: "Yes. Kuchu Puchu is free on Google Play, the App Store and the website, with no ads, no subscription and nothing to buy inside the app." },
      { q: "What age is Kuchu Puchu for?", a: "Kuchu Puchu is made for children aged 3 to 8: preschool, kindergarten and the first years of school." },
      { q: "Can kids post videos on Kuchu Puchu?", a: "No. Kids only watch on Kuchu Puchu. Videos come from creators approved by the Kuchu Puchu team, are reviewed before they go live, and comments are turned off, so strangers can't contact children." },
      { q: "Which app lets kids make their own short videos safely?", a: "Zigazoo lets kids record moderated video answers to prompts and has no private messages. For tweens aged 9 and up, Coverstar has no direct messages and moderated public comments. Set these apps up together and check the privacy settings." },
      { q: "How do I download Kuchu Puchu?", a: "Search for \"Kuchu Puchu\" on Google Play or the App Store, or use the download buttons on mykuchupuchu.com. Kids can also watch free on the website without downloading anything." },
    ],
    related: [
      { label: "ABC & learning videos for kids", path: "/learning-videos-for-kids" },
      { label: "Nursery rhymes for kids", path: "/nursery-rhymes" },
      { label: "Funny cartoons for kids", path: "/cartoons-for-kids" },
      { label: "Kids stories", path: "/kids-stories" },
    ],
  },
];

export const blogPostBySlug = (slug: string) => BLOG_POSTS.find(p => p.slug === slug);
export const blogPostByPath = (path: string) => {
  const m = /^\/blog\/([a-z0-9-]+)\/?$/.exec(path.split(/[?#]/)[0]);
  return m ? blogPostBySlug(m[1]) : undefined;
};
