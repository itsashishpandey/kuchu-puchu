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
  compare: string[];     // one value per post.compareColumns entry
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
  compareColumns: string[];  // extra columns in the comparison table (after Ages and Cost); the first also shows on each app card
  appCategory: string;       // schema.org applicationCategory for the other apps
  apps: BlogApp[];
  sections?: { id: string; heading: string; paragraphs: string[]; points?: { title: string; text: string }[]; source?: string }[]; // after the apps
  tipsHeading: string;
  tips: { title: string; text: string }[];
  ctaMid: { heading: string; text: string };
  ctaEnd: { heading: string; text: string };
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
    title: "Top 8 Safe Apps for Kids Like TikTok in 2027 | Kuchu Puchu",
    description: "Looking for a safe TikTok for kids? Compare the top 8 kid-friendly video apps for 2027, led by Kuchu Puchu: free, no ads, made for ages 3–8.",
    h1: "Top 8 Apps for Kids Like TikTok: Safe Alternatives for 2027",
    published: "2026-11-18",
    updated: "2026-11-19",
    factsChecked: "18 November 2026",
    readMinutes: 9,
    image: "/images/illus-phone.webp",
    imageAlt: "A phone showing a kids video app with cartoon animal videos",
    excerpt: "Kids love short, swipeable videos, but TikTok is for ages 13 and up. Here are 8 safer apps for kids like TikTok, compared by age, cost and safety.",
    quickAnswer: "The best app for kids like TikTok is Kuchu Puchu for children aged 3–8: a free, ad-free short video app with no comments and no sign-up for kids, on Android and iPhone. Other safe options are YouTube Kids (big library), Zigazoo (kids make videos), PBS KIDS Video, Kidoodle.TV, Khan Academy Kids, Coverstar (for tweens 9+) and Kinzoo (family video messages).",
    intro: [
      "Kids love what makes TikTok fun: short, colorful videos you can swipe through. But TikTok's own rules say users must be at least 13, and its open comments, messages and endless feed are not built for young children.",
      "The good news: there are apps for kids like TikTok that keep the fun of short videos and leave out the risks. Some only let kids watch videos made for their age, some let older kids create safely, and some focus on learning. Below are the 8 best options for 2027, with what each one costs, who it is for and what to watch out for.",
    ],
    disclosure: "Kuchu Puchu is our app, so we put it first. We checked the facts about every other app on this list from their own store pages and websites, and we tell you what each one is good at, including where another app may suit your family better.",
    howWeChose: [
      { title: "Made for kids", text: "Videos or tools designed for children, not a grown-up app with a kids filter added later." },
      { title: "No strangers", text: "No private messages with people kids don't know, and no open comment sections for young kids." },
      { title: "Ads and costs", text: "Whether there are ads or paid extras, so you know what your child will see and what you may pay." },
      { title: "Parent controls", text: "Ways for grown-ups to manage languages, timers, reports or contacts." },
    ],
    compareColumns: ["Kids post videos", "Chat"],
    appCategory: "EntertainmentApplication",
    apps: [
      {
        rank: 1, id: "kuchu-puchu", name: "Kuchu Puchu",
        bestFor: "Short learning videos for ages 3–8",
        ages: "3–8", cost: "Free, no ads", compare: ["No (watch only)", "No comments or chat"],
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
        ages: "Up to 12", cost: "Free with limited ads", compare: ["No", "No"],
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
        ages: "About 6–12", cost: "Free, optional premium", compare: ["Yes, moderated", "No private messages"],
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
        ages: "2–8", cost: "Free", compare: ["No", "No"],
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
        ages: "Kids (rated 4+)", cost: "Free with ads, ad-free option", compare: ["No", "No"],
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
        ages: "2–8", cost: "Free, no ads", compare: ["No", "No"],
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
        ages: "9+", cost: "Free to download", compare: ["Yes", "Public comments only, no DMs"],
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
        ages: "All ages, parent-approved", cost: "Free, in-app purchases", compare: ["Video messages to family", "Parent-approved contacts only"],
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
    tipsHeading: "Tips for Using Video Apps with Young Kids",
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
    ctaMid: { heading: "Try Kuchu Puchu Free", text: "The TikTok-style video app made for kids aged 3–8: short learning videos, no ads, no comments and no sign-up." },
    ctaEnd: { heading: "Download the Kuchu Puchu App", text: "The safe, ad-free alternative to TikTok for kids aged 3–8. Free on Google Play and the App Store." },
  },
  {
    slug: "learning-apps-for-toddlers",
    topic: "Learning Apps for Toddlers & Preschoolers",
    crumb: "Learning apps for toddlers",
    title: "10 Best Learning Apps for Toddlers & Preschoolers in 2027 | Kuchu Puchu",
    description: "The 10 best learn-with-fun apps for toddlers and preschoolers in 2027, compared by age, cost and ads. Led by Kuchu Puchu: free, ad-free learning videos.",
    h1: "10 Best Learn-with-Fun Kids Apps for Toddlers & Preschoolers (2027)",
    published: "2026-11-19",
    updated: "2026-11-19",
    factsChecked: "19 November 2026",
    readMinutes: 11,
    image: "/images/hero-kids.webp",
    imageAlt: "Two smiling cartoon toddlers ready to learn with fun kids apps",
    excerpt: "Fun learning apps can help toddlers and preschoolers learn ABCs, numbers, colors and rhymes. Here are the 10 best for 2027, compared by age, cost and ads.",
    quickAnswer: "The best learn-with-fun app for toddlers and preschoolers is Kuchu Puchu: free, ad-free short videos that teach ABCs, counting, colors, shapes, animals, nursery rhymes and good habits, made for ages 3–8 on Android and iPhone. The best free learning games are Khan Academy Kids and PBS KIDS Games. Other top picks are Lingokids, Pok Pok, Sago Mini World, Hungry Caterpillar Play School, Kiddopia, ABCmouse and Duolingo ABC.",
    intro: [
      "Toddlers and preschoolers learn best through play: singing, copying, tapping, laughing and asking for \"again!\". A good learning app turns that into short, gentle activities that teach ABCs, numbers, colors, shapes, animals and first words, without ads or pressure.",
      "But app stores are full of apps labelled \"educational\" that are packed with ads, pop-ups and paid unlocks. We compared the best learn-with-fun kids apps for toddlers and preschoolers for 2027 by age, cost, ads and what kids actually learn, so you can choose the right one for your family. Most of these apps are for ages 2 and up; see our screen time section below for younger children.",
    ],
    disclosure: "Kuchu Puchu is our app, so we put it first. We checked the facts about every other app on this list from its own store listing and website, and we say where another app may suit your child better, for example for 2-year-olds or for hands-on learning games.",
    howWeChose: [
      { title: "Made for little ones", text: "Big pictures, voices and simple taps, so toddlers and preschoolers can play without reading." },
      { title: "Real early learning", text: "Letters, phonics, numbers, shapes, colors, words and feelings, not just tapping for rewards." },
      { title: "Ads and costs", text: "No ads aimed at kids, and a clear note on what's free and what needs a subscription." },
      { title: "Safety and privacy", text: "Kid-safe design, no chat with strangers, and privacy certifications where we could confirm them." },
    ],
    compareColumns: ["Ads", "Kids learn"],
    appCategory: "EducationalApplication",
    apps: [
      {
        rank: 1, id: "kuchu-puchu", name: "Kuchu Puchu",
        bestFor: "Fun learning videos: rhymes, ABCs and counting",
        ages: "3–8", cost: "Free", compare: ["No ads", "ABCs, numbers, colors, shapes, rhymes, animals, good habits"],
        platforms: "Android, iPhone, web",
        summary: [
          "Kuchu Puchu is a free kids video app full of short, funny learning videos for children aged 3 to 8, which makes it a great fit for 3-year-olds and preschoolers. Little ones learn ABCs and phonics, counting and numbers, colors and shapes, animal names and sounds, nursery rhymes and poems, stories, and good habits and feelings.",
          "The videos are short, so they suit a little attention span, and the app opens straight into a simple swipe-to-watch feed, so kids don't need to read. Every creator is approved by the Kuchu Puchu team and every video is reviewed before it goes live. There are no ads, no comments and no sign-up for kids, and videos come in Hindi, English, Punjabi, Haryanvi, Urdu and more.",
        ],
        highlights: [
          "Free, with no ads and nothing to buy",
          "Short videos sized for little attention spans",
          "Learn ABCs, numbers, colors, shapes, animals, rhymes and good habits",
          "Videos in Hindi, English and more; grown-ups choose the languages",
          "No comments, no chat and no account needed for kids",
          "No advertising IDs or tracking tools",
        ],
        goodToKnow: [
          "Kuchu Puchu is made for ages 3–8. For children under 3, keep screen time very small and watch together.",
          "It's a new app, so its video library is still growing.",
        ],
        links: [
          { label: "Get it on Google Play", url: PLAY, own: true },
          { label: "Download on the App Store", url: APPLE, own: true },
          { label: "Watch free on the website", url: "https://mykuchupuchu.com/", own: true },
        ],
      },
      {
        rank: 2, id: "khan-academy-kids", name: "Khan Academy Kids",
        bestFor: "A free, complete early-learning program",
        ages: "2–8", cost: "Free", compare: ["No ads", "Phonics, reading, math, logic, creativity"],
        platforms: "iPhone, iPad, Android, Fire tablets",
        summary: [
          "Khan Academy Kids comes from the nonprofit Khan Academy and is completely free: no ads, no subscriptions and nothing to buy. Kids follow a friendly cast of animal characters through thousands of activities and hundreds of read-aloud books.",
          "It covers phonics and reading, math, logic, creativity and social-emotional skills, and was developed with experts from Stanford's Graduate School of Education. Activities can be downloaded to use offline.",
        ],
        highlights: ["100% free, with no ads or subscriptions", "Thousands of activities and hundreds of books", "Works offline once downloaded", "Parents' Choice Gold award"],
        goodToKnow: ["The app is in English; some books are read aloud in Spanish.", "It's game-based, so younger toddlers may need a grown-up to help at first."],
        links: [{ label: "Khan Academy Kids", url: "https://www.khanacademykids.org/" }],
      },
      {
        rank: 3, id: "pbs-kids-games", name: "PBS KIDS Games",
        bestFor: "Free games with favorite PBS KIDS characters",
        ages: "2–8", cost: "Free", compare: ["No ads", "Math, reading, science, feelings"],
        platforms: "iPhone, iPad, Android, Fire tablets, web",
        summary: [
          "PBS KIDS Games brings together hundreds of free learning games starring characters from PBS KIDS shows. The games cover math, reading, science, engineering, art and social-emotional skills, and dozens of them are in Spanish.",
          "It's free, with no in-app purchases, and games can be downloaded to play offline.",
        ],
        highlights: ["Free, with no in-app purchases", "280+ games with familiar characters", "Games in English and Spanish", "Offline downloads"],
        goodToKnow: ["After funding cuts, PBS KIDS has retired some older web games, but this app is still being updated.", "The characters come from US TV shows your child may not know yet."],
        links: [{ label: "PBS KIDS Games", url: "https://pbskids.org/apps/play-pbs-kids-games" }],
      },
      {
        rank: 4, id: "lingokids", name: "Lingokids",
        bestFor: "Learning English and early skills through play",
        ages: "2–8", cost: "Free Basic, paid Plus", compare: ["No ads", "English, letters, math, science, music"],
        platforms: "iPhone, iPad, Android, Fire tablets",
        summary: [
          "Lingokids mixes games, songs and short shows to teach early skills: letters and reading, math, science, music, art and feelings. It's popular with families who want their kids to pick up English as they play.",
          "There are no ads in either version. The free Basic plan allows a limited number of activities each day; the paid Lingokids Plus plan unlocks the full library, offline play and up to 4 child profiles, with a 7-day free trial.",
        ],
        highlights: ["No ads, even in the free version", "Thousands of games, songs and shows", "kidSAFE COPPA certified", "Up to 4 child profiles with Plus"],
        goodToKnow: ["The free plan is limited to 10 activities a day.", "Plus is a subscription that renews automatically, so set a reminder before the trial ends."],
        links: [{ label: "Lingokids", url: "https://lingokids.com/" }],
      },
      {
        rank: 5, id: "pok-pok", name: "Pok Pok",
        bestFor: "Calm, Montessori-inspired play",
        ages: "2–8", cost: "Subscription, 7-day free trial", compare: ["No ads", "Numbers, shapes, cause and effect, building"],
        platforms: "iPhone, iPad, Android, Fire tablets",
        summary: [
          "Pok Pok is a set of calm, open-ended digital toys inspired by Montessori ideas. There are no levels, no scores, no winning or losing and no words to read, so 2-year-olds can explore on their own.",
          "Kids build, draw, sort and experiment to discover how things work, which grows early STEM thinking: numbers, shapes, cause and effect and problem solving. It has won an Apple Design Award.",
        ],
        highlights: ["No ads, no reading needed, no winning or losing", "Calm, gentle design", "Apple Design Award and App Store Award winner", "Works offline"],
        goodToKnow: ["It needs a subscription after the 7-day free trial.", "It's free play, not step-by-step lessons: great for curiosity rather than ABC practice."],
        links: [{ label: "Pok Pok on the App Store", url: "https://apps.apple.com/us/app/pok-pok-montessori-preschool/id1550204730" }],
      },
      {
        rank: 6, id: "sago-mini-world", name: "Sago Mini World",
        bestFor: "Pretend play and creativity for little ones",
        ages: "2–6", cost: "Subscription, free trial", compare: ["No ads for subscribers", "Pretend play, creativity, feelings"],
        platforms: "iPhone, iPad, Android, Fire tablets",
        summary: [
          "Sago Mini World is a big playground of gentle games starring cute animal characters. Kids explore playful worlds where they build, pretend and make music, which grows imagination, creativity and early social-emotional skills.",
          "It's made for toddlers and preschoolers and is kidSAFE and COPPA certified. Subscribers get no ads and no in-app purchases, and downloaded games play offline.",
        ],
        highlights: ["Made for ages 2–6", "No ads or in-app purchases for subscribers", "kidSAFE and COPPA certified", "Parents' Choice Gold award"],
        goodToKnow: ["It needs a subscription after the free trial.", "It's open-ended play rather than an ABC or math course, and it's a large download, so use Wi-Fi."],
        links: [{ label: "Sago Mini World", url: "https://sagomini.com/world/" }],
      },
      {
        rank: 7, id: "hungry-caterpillar-play-school", name: "Hungry Caterpillar Play School",
        bestFor: "Montessori-inspired lessons with Eric Carle's art",
        ages: "2–6", cost: "Subscription, free samples", compare: ["No third-party ads", "ABCs, numbers 1–10, shapes, nature"],
        platforms: "iPhone, iPad, Android, Fire tablets",
        summary: [
          "Hungry Caterpillar Play School from StoryToys brings The Very Hungry Caterpillar and Eric Carle's famous artwork into a gentle preschool. Activities follow Montessori ideas and cover ABCs and letter tracing, numbers 1 to 10, shapes, patterns, nature, music and even early coding.",
          "There's no third-party advertising, and downloaded activities play offline. Some activities are free to try; the full school needs a subscription.",
        ],
        highlights: ["Beautiful Eric Carle artwork", "Letter tracing, including writing their own name", "No third-party ads", "Apple Editors' Choice"],
        goodToKnow: ["Most activities need a subscription.", "The subscription renews automatically; check how to cancel before you start."],
        links: [{ label: "Hungry Caterpillar Play School on the App Store", url: "https://apps.apple.com/us/app/hungry-caterpillar-play-school/id1318671922" }],
      },
      {
        rank: 8, id: "kiddopia", name: "Kiddopia",
        bestFor: "A big all-in-one preschool app",
        ages: "2–7", cost: "Subscription, 7-day free trial", compare: ["No ads", "Phonics, math, science, art, role-play"],
        platforms: "iPhone, iPad, Android, Fire tablets",
        summary: [
          "Kiddopia packs many kinds of learning games into one app: phonics and sight words, counting and shapes, early math, science, art, music, role-play and simple coding.",
          "It has no ads, has been kidSAFE and COPPA certified since 2018, and works offline. It's a subscription after a 7-day free trial.",
        ],
        highlights: ["No ads", "kidSAFE and COPPA certified", "Works offline", "Award-winning, including a Parents' Choice award"],
        goodToKnow: ["It's subscription-only after the free trial.", "Some games feature licensed brand characters, which some parents prefer to avoid."],
        links: [{ label: "Kiddopia", url: "https://kiddopia.com/" }],
      },
      {
        rank: 9, id: "abcmouse", name: "ABCmouse",
        bestFor: "A big library of early reading and math",
        ages: "2–8", cost: "Free Basic, paid Premium", compare: ["No ads", "Phonics, counting, science, art, music"],
        platforms: "iPhone, iPad, Android, Fire tablets, web",
        summary: [
          "ABCmouse from Age of Learning is one of the best-known early-learning programs. In January 2026 it relaunched as a new app, ABCmouse: Kids Learning Games, with activities in phonics, sight words, counting, adding, shapes, science, art, music and early coding.",
          "There are no ads. The free Basic plan includes a limited number of activities a day, and Premium unlocks everything. It holds a kidSAFE+ COPPA seal and works offline once installed.",
        ],
        highlights: ["No ads", "A free Basic plan to try it", "kidSAFE+ COPPA seal", "Plays on the web as well as in the app"],
        goodToKnow: ["Progress from the old ABCmouse Classic app doesn't carry over to the new app.", "In 2020 the company settled US FTC charges over its subscription and cancellation practices, so check your renewal settings when you subscribe."],
        links: [{ label: "ABCmouse", url: "https://www.abcmouse.com/" }],
      },
      {
        rank: 10, id: "duolingo-abc", name: "Duolingo ABC",
        bestFor: "Free learn-to-read lessons for preschoolers",
        ages: "3–8", cost: "Free", compare: ["No ads", "Letters, phonics, sight words, reading"],
        platforms: "iPhone, iPad, Android, Fire tablets",
        summary: [
          "Duolingo ABC (listed in the stores as Learn to Read - Duolingo ABC) comes from the makers of the Duolingo language app. Its short lessons teach the alphabet, phonics, letter tracing, sight words and early reading, with read-along stories, for kids from preschool to second grade.",
          "It's completely free, with no ads and no in-app purchases, and it works offline.",
        ],
        highlights: ["100% free, with no ads or purchases", "Short, bite-sized reading lessons", "Works offline", "Apple Editors' Choice"],
        goodToKnow: ["It's best for kids aged 3 and up who are ready for letters, and it's English only.", "The iPhone app hasn't been updated since 2023; the Android app is still updated."],
        links: [{ label: "Duolingo ABC", url: "https://abc.duolingo.com/" }],
      },
    ],
    sections: [
      {
        id: "screen-time",
        heading: "How Much Screen Time Is OK for Toddlers?",
        paragraphs: [
          "Learning apps work best in small doses. Here's what the World Health Organization (WHO) and the American Academy of Pediatrics (AAP) advise for young children:",
        ],
        points: [
          { title: "Under 18 months", text: "Avoid screens, apart from video calls with family (AAP). The WHO advises no screen time for babies under 1 and no sitting-still screen time for 1-year-olds." },
          { title: "18 months to 2 years", text: "If you start, choose high-quality content, keep it short and watch together (AAP)." },
          { title: "Ages 2 to 5", text: "No more than 1 hour a day of high-quality content, and less is better (WHO for ages 2–4, AAP for ages 2–5)." },
          { title: "Quality and togetherness", text: "The AAP's 2026 guidance puts more weight on what kids watch and on watching together than on counting minutes. Sit with your child, talk about what you see, and keep screens away from meals and bedtime." },
        ],
        source: "Sources: WHO guidelines on physical activity, sedentary behaviour and sleep for children under 5 (2019); AAP policy statements \"Media and Young Minds\" (2016) and \"Digital Ecosystems, Children, and Adolescents\" (2026).",
      },
      {
        id: "videos-or-games",
        heading: "Learning Videos or Learning Games: Which Is Better for Toddlers?",
        paragraphs: [
          "Both have a place. Short learning videos, like Kuchu Puchu's nursery rhymes, ABC songs and animal videos, are great for listening, new words, singing along and copying actions. Learning games, like Khan Academy Kids or Pok Pok, let kids tap, trace, sort and solve, which builds hand skills and problem solving.",
          "For most families, a mix works best: a few short videos to sing and dance along to, a learning game now and then, and lots of real-world play in between. Whatever you choose, the biggest boost comes from a grown-up joining in.",
        ],
      },
    ],
    tipsHeading: "Tips for Learning with Apps at Home",
    tips: [
      { title: "Join in", text: "Sing along, point at the screen and name what you see. Toddlers learn far more when a grown-up joins in." },
      { title: "Keep it short", text: "A few videos or one or two games is plenty for little ones. Stop while it's still fun, and give a gentle warning before the end." },
      { title: "Bring it off the screen", text: "After a counting video, count spoons at lunch. After an ABC song, hunt for the letter B around the house." },
      { title: "Choose ad-free apps", text: "Toddlers can't tell an ad from a game. Kuchu Puchu, Khan Academy Kids, PBS KIDS Games and Duolingo ABC are free and ad-free." },
      { title: "Lock purchases and set reminders", text: "Turn on your phone's parental controls so kids can't buy anything, and set a reminder before any free trial turns into a paid subscription." },
    ],
    faqs: [
      { q: "What is the best learning app for toddlers?", a: "For toddlers turning 3 and preschoolers, Kuchu Puchu is our top pick: short, funny learning videos that teach ABCs, numbers, colors, shapes, animals, rhymes and good habits, free with no ads, on Android and iPhone. For free learning games, try Khan Academy Kids or PBS KIDS Games, and for calm, open-ended play, Pok Pok or Sago Mini World." },
      { q: "What are the best free learning apps for preschoolers?", a: "Kuchu Puchu, Khan Academy Kids, PBS KIDS Games and Duolingo ABC are free with no ads. Lingokids and ABCmouse have free basic plans with a daily activity limit." },
      { q: "At what age can a toddler use a learning app?", a: "The AAP advises no screens for babies under 18 months except video calls with family, and the WHO advises no screen time under age 1. From 18 to 24 months, the AAP suggests high-quality content watched together, and for ages 2 to 5 no more than about 1 hour a day. Most apps on this list are for ages 2 and up; Kuchu Puchu is made for ages 3 to 8." },
      { q: "Are learning apps good for toddlers?", a: "They can be, when the app is made for young children, has no ads, and a grown-up joins in. Short sessions that teach songs, words, letters and numbers, followed by real-world play, help the most. Apps should add to reading, talking and playing together, not replace them." },
      { q: "Is Kuchu Puchu good for toddlers?", a: "Kuchu Puchu is made for children aged 3 to 8, so it suits 3-year-olds and preschoolers. Its short videos are sized for little attention spans, with no ads, no comments and no sign-up for kids. For children under 3, keep screen time very small and watch together." },
      { q: "Which kids learning apps have no ads?", a: "Kuchu Puchu, Khan Academy Kids, PBS KIDS Games, Duolingo ABC, Lingokids, Pok Pok, Kiddopia and ABCmouse have no ads. Sago Mini World is ad-free for subscribers, and Hungry Caterpillar Play School has no third-party ads." },
      { q: "How long should a toddler use a learning app each day?", a: "For ages 2 to 5, the WHO and the AAP suggest no more than 1 hour of screen time a day, and less is better. Short sessions of a few videos or games, with a grown-up nearby, work best." },
      { q: "How do I download Kuchu Puchu?", a: "Search for \"Kuchu Puchu\" on Google Play or the App Store, or use the download buttons on mykuchupuchu.com. Kids can also watch free on the website without downloading anything." },
    ],
    related: [
      { label: "ABC & learning videos for kids", path: "/learning-videos-for-kids" },
      { label: "Nursery rhymes for kids", path: "/nursery-rhymes" },
      { label: "Animal names & sounds", path: "/animal-videos-for-kids" },
      { label: "Good habits for kids", path: "/good-habits-for-kids" },
      { label: "Kids stories", path: "/kids-stories" },
    ],
    ctaMid: { heading: "Learn with Fun on Kuchu Puchu", text: "Short, funny learning videos for preschoolers and kids aged 3–8: ABCs, numbers, colors, rhymes and more. Free, with no ads." },
    ctaEnd: { heading: "Download Kuchu Puchu Free", text: "The learn-with-fun video app for kids aged 3–8. No ads, no sign-up for kids. On Google Play and the App Store." },
  },
];

export const blogPostBySlug = (slug: string) => BLOG_POSTS.find(p => p.slug === slug);
export const blogPostByPath = (path: string) => {
  const m = /^\/blog\/([a-z0-9-]+)\/?$/.exec(path.split(/[?#]/)[0]);
  return m ? blogPostBySlug(m[1]) : undefined;
};
