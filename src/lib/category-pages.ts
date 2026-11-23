// The written text of the 25 category landing pages and the language pages (addresses, titles and descriptions are in
// seo-pages.ts). A plain module: the server uses the FAQs for structured data, the page shows it all.
// Keep every sentence true: no numbers, no named shows, no promise that particular videos exist.

export type CategoryContent = {
  dbSlug: string;
  h1: string;
  intro: string;
  videosHeading: string;
  topicsHeading: string;
  topicsText: string;
  learnHeading: string;
  learn: { title: string; text: string }[];
  ctaHeading: string;
  ctaText: string;
  tipsHeading: string;
  tips: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
  related: string[]; // dbSlugs
  /** optional "Meet the characters" section (cartoons page) */
  characters?: { heading: string; text: string; items: { name: string; emoji: string; text: string }[] };
  /** shows the "How to draw Kuchu & Puchu" guide (drawing page; also adds HowTo structured data) */
  drawingGuide?: boolean;
};

export const CATEGORY_CONTENT: CategoryContent[] = [
  {
    dbSlug: "cartoons-animation",
    h1: "Kuchu Puchu Cartoon: Funny Cartoon Videos & Animation for Kids",
    intro: "The Kuchu Puchu cartoon is the free home of short, funny cartoons and animation for kids, in Hindi, English, Punjabi and more. Kids laugh along with animal classes like the Jungle School cartoons, gentle animal friends and happy little adventures. Every cartoon is made for children aged 3 to 8, with no violence, no scary scenes and no ads, and is reviewed by the Kuchu Puchu team before it goes live. Some families search for it as the Puchu cartoon or Puchu Puchu cartoon: you are in the right place.",
    videosHeading: "Watch Kuchu Puchu Cartoons",
    topicsHeading: "Cartoon Topics Kids Love",
    topicsText: "Pick a topic to find the kind of cartoon your child enjoys most. Choose from funny cartoons, adventure cartoons, animal cartoons, fairy tale cartoons, vehicle cartoons, dinosaur cartoons and space cartoons.",
    learnHeading: "What Kids Learn from Kuchu Puchu Cartoons",
    learn: [
      {
        title: "Following a Story",
        text: "A cartoon has a beginning, a middle and an end. Kids learn to follow what happens next and remember the order of events."
      },
      {
        title: "New Words and Phrases",
        text: "Characters talk in simple, everyday language. Children hear new words in context and often start using them in their own play."
      },
      {
        title: "Understanding Feelings",
        text: "Kids see characters feel happy, sad, surprised or worried. This helps them name feelings and understand how a friend might feel."
      },
      {
        title: "Imagination and Pretend Play",
        text: "Adventures in space, with dinosaurs or in fairy tale lands give kids fresh ideas for drawing, building and their own pretend games."
      },
      {
        title: "Friendship and Kindness",
        text: "Gentle cartoons can show characters sharing, helping and solving problems together, giving kids simple examples of how to be a good friend."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Cartoons in the App",
    ctaText: "Watch Kuchu Puchu cartoons in the free app, with no ads, no subscription and no account needed for kids.",
    tipsHeading: "How to Enjoy Cartoons at Home",
    tips: [
      {
        title: "Watch Together Sometimes",
        text: "Sit with your child for a cartoon or two. Laugh together, point at the characters and ask what they think will happen next. Shared watching turns screen time into talk time."
      },
      {
        title: "Keep Sessions Short",
        text: "Kuchu Puchu cartoons are short, so it is easy to watch one or two and then stop. Agree on how many videos before you start, and give a gentle warning near the end."
      },
      {
        title: "Bring the Cartoon into Play",
        text: "After watching, ask your child to draw a favorite character or act out the story with toys. This helps them remember the story and use their own imagination."
      }
    ],
    characters: {
      heading: "Meet the Kuchu Puchu Characters",
      text: "Kuchu and Puchu are the two friends in the Kuchu Puchu app icon, and the cartoons are full of funny animal characters kids love to watch again and again.",
      items: [
        { name: "Kuchu", emoji: "👦", text: "The cheerful boy in the yellow T-shirt from the Kuchu Puchu app icon, with messy brown hair and a big smile. Our drawing page shows how to draw him step by step." },
        { name: "Puchu", emoji: "👧", text: "The happy girl with a ponytail and a red bow, Kuchu's best friend in the Kuchu Puchu app icon. Kids can learn to draw her too." },
        { name: "The Jungle School Teachers", emoji: "🦁", text: "In the Jungle School cartoons, a lion, a monkey (bandar), a crocodile, a gorilla and a lioness (sherni) take turns teaching a class of animal students." },
        { name: "The Naughty Monkey & Friends", emoji: "🐒", text: "The naughty monkey, the bunny and their classmates give funny wrong answers, make silly mistakes and learn something new every time." },
      ],
    },
    faqs: [
      {
        q: "Who are the Kuchu Puchu characters?",
        a: "Kuchu and Puchu are the two kids in the Kuchu Puchu app icon: Kuchu is the boy in the yellow T-shirt and Puchu is the girl with the red bow. In the cartoons, kids also meet funny animal characters, like the lion, monkey and crocodile teachers of the Jungle School cartoons and their naughty animal students."
      },
      {
        q: "Is the Kuchu Puchu cartoon in Hindi?",
        a: "Yes. Many Kuchu Puchu cartoons are in Hindi, and there are cartoons in English, Punjabi, Urdu and more. A grown-up can choose which languages to show, and the Kuchu Puchu Hindi videos page shows every video in Hindi in one place."
      },
      {
        q: "Is there a Kuchu Puchu cartoon movie?",
        a: "Not yet. Kuchu Puchu cartoons are short episodes, each only a minute or so long, which suits little attention spans. Kids can watch them one after another for free on the website or in the Kuchu Puchu app, with no ads."
      },
      {
        q: "Are Kuchu Puchu cartoons safe for young children?",
        a: "Kuchu Puchu cartoons are made to be gentle and suitable for children aged 3 to 8. Every video must follow clear rules: no violence, no scary or adult content, no bad language and no ads. Videos are reviewed by the Kuchu Puchu team before they go live, comments are turned off, and parents can report any video."
      },
      {
        q: "Are Kuchu Puchu cartoons free to watch?",
        a: "Yes, Kuchu Puchu cartoons are free. There is no subscription and there are no in-app purchases. You can watch cartoons on the website or in the free Kuchu Puchu app, and there are no ads anywhere, so your child is not interrupted by commercials."
      },
      {
        q: "What kinds of cartoons are on Kuchu Puchu?",
        a: "Kuchu Puchu Cartoons is the place for gentle, funny and adventurous animated videos. Its topics are funny cartoons, adventure cartoons, animal cartoons, fairy tale cartoons, vehicle cartoons, dinosaur cartoons and space cartoons. Each topic helps your child find the kind of cartoon they like best."
      },
      {
        q: "Do kids need an account to watch Kuchu Puchu cartoons?",
        a: "No. Kids can watch Kuchu Puchu cartoons without an account, on the website or in the free Kuchu Puchu app. In the app, settings such as languages and reporting sit behind a grown-ups check, so little hands cannot change them by accident."
      },
    ],
    related: [
      "school-classroom",
      "kids-comedy",
      "animals",
      "rhymes-songs"
    ]
  },
  {
    dbSlug: "rhymes-songs",
    h1: "Kuchu Puchu Nursery Rhymes & Songs for Kids",
    intro: "Kuchu Puchu Nursery Rhymes is the home of nursery rhymes for kids, trending kids rhymes, sing-along songs, action songs, lullabies and simple learning songs. They are made for children aged 3 to 8, and Kuchu Puchu has videos in Hindi, English, Punjabi and more. Every video is short, ad-free and reviewed by the Kuchu Puchu team, so little ones can sing, clap and move along happily.",
    videosHeading: "Watch Kuchu Puchu Nursery Rhymes",
    topicsHeading: "Nursery Rhyme Topics Kids Love",
    topicsText: "Choose a topic to find the right song for the moment, from bouncy action songs to calm lullabies. Topics include nursery rhymes, sing-along songs, action songs, lullabies, ABC songs, counting songs and festival songs.",
    learnHeading: "What Kids Learn from Kuchu Puchu Nursery Rhymes",
    learn: [
      {
        title: "New Words and Sounds",
        text: "Rhymes repeat simple words again and again. This helps children hear new words clearly, say them out loud and grow their vocabulary."
      },
      {
        title: "Rhythm and Beat",
        text: "Clapping, tapping and bouncing to a song helps kids feel a steady rhythm and beat, a fun first step into music and movement."
      },
      {
        title: "Rhyming and Listening",
        text: "Hearing words that sound alike, like cat and hat, helps kids notice the sounds inside words, a useful skill before reading."
      },
      {
        title: "Memory and Confidence",
        text: "Short, repeating verses are easy to remember. When kids learn a whole rhyme by heart, they feel proud to sing it for the family."
      },
      {
        title: "Counting and ABCs",
        text: "Counting songs and ABC songs turn numbers and letters into tunes, so kids can practice them while they sing and play."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Nursery Rhymes in the App",
    ctaText: "Sing along with Kuchu Puchu nursery rhymes and songs in the free app, with no ads and no subscription.",
    tipsHeading: "How to Enjoy Nursery Rhymes at Home",
    tips: [
      {
        title: "Sing Along Together",
        text: "Sing the rhyme with your child, even if you don't know all the words. Your voice matters more than a perfect tune, and kids love to copy you."
      },
      {
        title: "Add Actions and Clapping",
        text: "Clap, tap your knees or march around the room while the song plays. Moving with the music makes rhymes more fun and easier to remember."
      },
      {
        title: "Make Up Your Own Verses",
        text: "Change a word in a favorite rhyme to your child's name, a pet or a family member. Playing with words like this is silly, fun and good practice with language."
      }
    ],
    faqs: [
      {
        q: "What age are Kuchu Puchu nursery rhymes for?",
        a: "Kuchu Puchu nursery rhymes are made for children aged 3 to 8. That covers preschool, kindergarten and the first school years. Younger kids enjoy the simple tunes and actions, while older kids can learn the words by heart and sing along on their own."
      },
      {
        q: "Are Kuchu Puchu nursery rhymes in Hindi and English?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more languages. A grown-up can choose which languages to show, so your child can enjoy rhymes and songs in the languages your family speaks. In the app, this setting sits behind a grown-ups check."
      },
      {
        q: "How do nursery rhymes help young children learn?",
        a: "Nursery rhymes help children hear and repeat new words, notice rhyming sounds and feel a steady beat. The short lines and repeating choruses are easy to remember, which builds confidence. Kuchu Puchu rhymes work best when a grown-up sings along, so your child hears the words from you as well as from the video."
      },
      {
        q: "Can I use Kuchu Puchu lullabies at bedtime?",
        a: "Yes. Lullabies are one of the topics in Kuchu Puchu Nursery Rhymes, meant for calm, quiet moments. A soft, slow song can be a nice part of winding down. Try watching one lullaby together, then switch the screen off and keep singing softly as your child settles."
      },
      {
        q: "Are Kuchu Puchu nursery rhymes free and ad-free?",
        a: "Yes. Kuchu Puchu nursery rhymes are free to watch on the website and in the free Kuchu Puchu app. There is no subscription, no in-app purchases and no ads anywhere. Kids can watch without an account, and comments are turned off on every video."
      }
    ],
    related: [
      "dance-movement",
      "early-learning",
      "stories",
      "learn-languages"
    ]
  },
  {
    dbSlug: "stories",
    h1: "Kuchu Puchu Moral & Bedtime Stories for Kids",
    intro: "Kuchu Puchu Stories are short stories for kids, including bedtime stories, moral stories, fairy tales and folk tales. They are made for children aged 3 to 8, so every story is short and easy for little ones to enjoy. Each story video is reviewed by the Kuchu Puchu team before it goes live, with no ads and nothing scary.",
    videosHeading: "Watch Kuchu Puchu Stories",
    topicsHeading: "Story Topics Kids Love",
    topicsText: "Choose a topic to find the right story for the moment, from a calm bedtime story to a clever folk tale. Topics include bedtime stories, moral stories, fairy tales, folk tales and Panchatantra, animal stories and read-aloud books.",
    learnHeading: "What Kids Learn from Kuchu Puchu Stories",
    learn: [
      {
        title: "Listening and Focus",
        text: "Following a story from start to finish helps kids practice listening carefully and paying attention for a little longer each time."
      },
      {
        title: "Right and Wrong",
        text: "Moral stories share simple lessons about honesty, sharing and kindness, and give families an easy way to talk about good choices."
      },
      {
        title: "Words and Storytelling",
        text: "Stories bring new words and simple sentences. Children often start retelling stories in their own words, which builds language and confidence."
      },
      {
        title: "Story Order and Memory",
        text: "Kids learn that stories have a beginning, a middle and an end, and practice remembering what happened first, next and last."
      },
      {
        title: "Folk Tales and Culture",
        text: "Folk tales and Panchatantra stories connect kids with tales that families have shared for generations, often in languages they hear at home."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Stories in the App",
    ctaText: "Enjoy short Kuchu Puchu stories in the free app, with no ads, no subscription and no account needed for kids.",
    tipsHeading: "How to Enjoy Stories at Home",
    tips: [
      {
        title: "Talk About the Story",
        text: "After a story, ask simple questions: Who was in it? What happened? What would you do? Talking it over helps kids remember the story and think about the lesson."
      },
      {
        title: "Make Story Time a Routine",
        text: "Pick a regular time for one or two short stories, like after dinner. A small, steady routine helps kids look forward to story time and know when it ends."
      },
      {
        title: "Read and Retell Together",
        text: "Use the video as a starting point. Read a book together on the same idea, or ask your child to retell the story with toys or drawings."
      }
    ],
    faqs: [
      {
        q: "What are moral stories for kids?",
        a: "Moral stories are short tales with a simple lesson, like telling the truth, sharing or being kind. Kuchu Puchu moral stories are made for children aged 3 to 8, so the lesson is easy to understand. Ask your child what the story taught them to help the lesson stick."
      },
      {
        q: "Are Kuchu Puchu stories good for bedtime?",
        a: "Kuchu Puchu has a Bedtime Stories topic, meant for calm, quiet moments before sleep. The videos are short, so it is easy to watch one story together and then stop. You can then switch off the screen and finish the evening with a cuddle, a song or a book."
      },
      {
        q: "Does Kuchu Puchu have Panchatantra stories?",
        a: "Folk Tales & Panchatantra is one of the topics in Kuchu Puchu Stories. It is the place for traditional tales, often with clever animals and a lesson at the end. Like every Kuchu Puchu video, these stories are short, ad-free and reviewed before they go live."
      },
      {
        q: "How long are Kuchu Puchu story videos?",
        a: "Kuchu Puchu videos are short, under about a minute and a half each. That length suits young children, who can follow a short story from start to finish. Short stories also make it easy to set a simple limit, such as two stories and then time to play."
      },
      {
        q: "Who makes Kuchu Puchu stories?",
        a: "Kuchu Puchu stories are made by independent creators who apply and are approved by the Kuchu Puchu team. Every video is reviewed before it goes live and must follow clear rules: no violence, no scary or adult content, no bad language and no ads. Parents can report any video."
      }
    ],
    related: [
      "cartoons-animation",
      "rhymes-songs",
      "good-habits",
      "animals"
    ]
  },
  {
    dbSlug: "early-learning",
    h1: "Kuchu Puchu ABC, Numbers & Learning Videos for Kids",
    intro: "Kuchu Puchu Learning is the place for learning videos for kids, from ABC videos and phonics to counting, colors, shapes and first words. These short videos are made for children aged 3 to 8 and help them learn through play. There are no ads, and every video is reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Learning Videos",
    topicsHeading: "Learning Topics for Little Learners",
    topicsText: "Choose a topic to practice one skill at a time, from letters and numbers to the days of the week. Topics include alphabet and phonics, numbers and counting, colors and shapes, first words, days, months and seasons, opposites and patterns, and learning games.",
    learnHeading: "What Kids Learn from Kuchu Puchu Learning Videos",
    learn: [
      {
        title: "Letters and Phonics",
        text: "ABC videos help kids recognize letters and match each one to its sound, an early step toward reading simple words."
      },
      {
        title: "Counting and Numbers",
        text: "Counting videos help children say numbers in order, count objects one by one and start to understand more and less."
      },
      {
        title: "Colors and Shapes",
        text: "Kids learn to name colors and spot shapes like circles, squares and triangles, then find them in toys, food and the world around them."
      },
      {
        title: "First Words",
        text: "First-word videos connect pictures with words, helping children build vocabulary for everyday things like animals, food and family."
      },
      {
        title: "Patterns and Thinking",
        text: "Opposites, patterns and learning games help kids compare, sort and guess what comes next, building early thinking and problem-solving skills."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Learning Videos in the App",
    ctaText: "Practice ABCs, counting, colors and shapes with Kuchu Puchu learning videos in the free app, with no ads or subscription.",
    tipsHeading: "How to Enjoy Learning Videos at Home",
    tips: [
      {
        title: "Practice Off the Screen",
        text: "After an ABC or counting video, look for letters on food packets or count spoons at the table. Real-life practice helps new ideas stick."
      },
      {
        title: "Focus on One Skill",
        text: "Pick one topic, like colors, for a few days. Small steps and repetition are easier for young kids than many new ideas at once."
      },
      {
        title: "Praise the Effort",
        text: "Cheer when your child tries, not only when they get it right. Mistakes are part of learning, and a happy mood keeps kids curious."
      }
    ],
    faqs: [
      {
        q: "What age are Kuchu Puchu ABC and learning videos for?",
        a: "Kuchu Puchu learning videos are made for children aged 3 to 8. Younger kids can start with letters, colors and counting, while older kids can practice phonics, patterns, days and months. You know your child best, so choose the topics that match where they are now."
      },
      {
        q: "Can Kuchu Puchu help my child learn the alphabet?",
        a: "Kuchu Puchu ABC and phonics videos are a fun way to practice letters and their sounds. They work best alongside reading together, writing letters and pointing out letters in everyday life. Short videos, watched often and talked about with a grown-up, can make the alphabet feel like a game."
      },
      {
        q: "How can I help my child learn counting?",
        a: "Start with small numbers and real objects, like counting toys, steps or fruit together. Kuchu Puchu has a Numbers & Counting topic for short counting videos, which you can watch together and then practice off the screen. A little practice every day is often easier for young kids than one long session."
      },
      {
        q: "Do Kuchu Puchu learning videos replace school or preschool?",
        a: "No. Kuchu Puchu learning videos are a fun extra, not a replacement for school, preschool or time with family. They can help kids practice letters, numbers, colors and shapes in a playful way. Playing, talking and reading together still matter most for young children."
      },
      {
        q: "Are Kuchu Puchu learning videos free?",
        a: "Yes. Kuchu Puchu learning videos are free on the website and in the free Kuchu Puchu app. There is no subscription, no in-app purchases and no ads anywhere. Kids can watch without an account, and comments are turned off, so they can focus on learning."
      }
    ],
    related: [
      "rhymes-songs",
      "learn-languages",
      "science-nature",
      "arts-crafts"
    ]
  },
  {
    dbSlug: "science-nature",
    h1: "Kuchu Puchu Science, Space & Dinosaurs for Kids",
    intro: "Kuchu Puchu Science is the place for science videos for kids who love to ask why. Its topics include curious questions, easy experiments with a grown-up, space and planets, plants, weather and dinosaurs, all made for children aged 3 to 8. Videos are short, ad-free and reviewed by the Kuchu Puchu team before they go live.",
    videosHeading: "Watch Kuchu Puchu Science Videos",
    topicsHeading: "Science Topics Curious Kids Love",
    topicsText: "Choose a topic to explore one big question at a time. Topics include science for kids, easy experiments to try with a grown-up, space and planets, the human body, weather and seasons, plants and gardens, and dinosaurs.",
    learnHeading: "What Kids Learn from Kuchu Puchu Science Videos",
    learn: [
      {
        title: "Asking Good Questions",
        text: "Science videos encourage kids to wonder why and how things happen, and to keep asking questions about the world around them."
      },
      {
        title: "Observing and Noticing",
        text: "Kids learn to look closely, notice changes and describe what they see, like a seed sprouting or clouds moving across the sky."
      },
      {
        title: "Simple Cause and Effect",
        text: "Easy experiments, always done with a grown-up, show that one thing can lead to another, like ice melting when it gets warm."
      },
      {
        title: "Space, Earth and Weather",
        text: "Kids get first ideas about the sun, moon, planets and seasons, and about why we have rainy, windy and sunny days."
      },
      {
        title: "Nature and Living Things",
        text: "Videos about plants, the human body and dinosaurs help kids learn how living things grow, eat and change over time."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Science Videos in the App",
    ctaText: "Explore space, plants, weather and dinosaurs with Kuchu Puchu science videos in the free app, with no ads and no subscription.",
    tipsHeading: "How to Enjoy Science Videos at Home",
    tips: [
      {
        title: "Try Experiments with a Grown-Up",
        text: "Always try experiments together with a grown-up, never alone. Use simple, everyday things, follow the steps slowly, and stop if anything feels unsafe."
      },
      {
        title: "Go on a Nature Walk",
        text: "After a video about plants or weather, step outside together. Look at leaves, clouds and bugs, and ask your child what they notice and why it might happen."
      },
      {
        title: "Find Answers Together",
        text: "When your child asks a big question, it is fine to say 'I don't know.' Look for the answer together in a book or another short video."
      }
    ],
    faqs: [
      {
        q: "Are Kuchu Puchu science experiments safe for kids to try?",
        a: "Science experiments should always be done with a grown-up. Kuchu Puchu science videos are made for children aged 3 to 8 and are reviewed by the Kuchu Puchu team before they go live. Even so, please watch first, use everyday materials and help your child with each step. Never let young kids try experiments alone."
      },
      {
        q: "Are Kuchu Puchu dinosaur videos scary?",
        a: "Kuchu Puchu dinosaur videos are meant to be fun, not frightening. Every Kuchu Puchu video must follow clear rules, including no scary content and no violence, and videos are reviewed before they go live. If anything ever upsets your child, you can report that video."
      },
      {
        q: "What age are Kuchu Puchu science videos for?",
        a: "Kuchu Puchu science videos are made for children aged 3 to 8. Younger kids enjoy simple questions about dinosaurs, plants and the sky, while older kids can learn more about space, the human body and weather. Watching together and talking about what you saw helps at every age."
      },
      {
        q: "Can kids learn about space and planets on Kuchu Puchu?",
        a: "Yes. Space & Planets is one of the topics in Kuchu Puchu Science. It is for short, simple videos about the sun, the moon, the stars and the planets. After watching, try looking at the night sky together and spotting the moon."
      },
      {
        q: "Do Kuchu Puchu science videos have ads?",
        a: "No. Kuchu Puchu has no ads anywhere, and videos cannot promote products or link to outside sites. Science videos are free on the website and in the free Kuchu Puchu app, with no subscription or in-app purchases. The app also has no advertising IDs or tracking tools."
      }
    ],
    related: [
      "animals",
      "our-world",
      "early-learning",
      "cartoons-animation"
    ]
  },
  {
    dbSlug: "animals",
    h1: "Kuchu Puchu Animal Videos for Kids",
    intro: "Kuchu Puchu animal videos for kids help children learn animal names and animal sounds, from farm and jungle animals to ocean life, birds and pets. The videos are short, free and made for children aged 3 to 8. Every video is reviewed by the Kuchu Puchu team before it goes live, and there are no ads anywhere.",
    videosHeading: "Watch Kuchu Puchu Animal Videos",
    topicsHeading: "Animal Topics Kids Love",
    topicsText: "Pick a topic to find videos about farm animals, wild animals, ocean animals, birds and insects, animal sounds and pet care. Each topic is a simple way for your child to explore the animals they like most.",
    learnHeading: "What Kids Learn from Kuchu Puchu Animal Videos",
    learn: [
      {
        title: "Animal Names",
        text: "Children see animals from the farm, the jungle and the sea and hear their names, which helps them learn new words and name animals they know."
      },
      {
        title: "Animal Sounds",
        text: "Kids listen to animal sounds like moo, roar, quack and buzz, then copy them and learn to match each sound to the right animal."
      },
      {
        title: "Where Animals Live",
        text: "Some animals live on farms, some in jungles and some in the sea. Kids learn to sort animals by the places they call home."
      },
      {
        title: "Kindness to Pets",
        text: "Pet care videos are about gentle ways to feed, play with and look after pets, so kids learn to be kind and careful with animals."
      },
      {
        title: "Looking and Comparing",
        text: "Kids notice size, color, legs, wings and fur, and start to compare animals: which one is big, which one can fly and which one swims."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Animal Videos in the App",
    ctaText: "Watch animal videos in the free Kuchu Puchu app, with no ads, no account needed and settings kept behind a grown-ups check.",
    tipsHeading: "How to Enjoy Animal Videos at Home",
    tips: [
      {
        title: "Make the Sounds Together",
        text: "Pause after an animal appears and ask your child, \"What sound does it make?\" Take turns making the sound. Silly voices are welcome and make learning feel like a game."
      },
      {
        title: "Spot Animals Around You",
        text: "After a video, look for real animals together: birds on a wall, a cat on the street or ants on the ground. Talk about their names, colors and what they do."
      },
      {
        title: "Keep It Short and Shared",
        text: "Watch one or two short videos, then switch to play. Your child can draw a favorite animal, act it out or find it in a picture book."
      }
    ],
    faqs: [
      {
        q: "How can I teach my child animal names?",
        a: "Start with animals your child already sees, like cats, dogs, cows and birds. Short Kuchu Puchu animal videos can help, because kids see an animal and hear its name together. Then point to animals in books or outside and ask your child to name them. Repeat often and keep it fun."
      },
      {
        q: "What are some easy animal sounds for kids to learn?",
        a: "Easy first animal sounds are a cow's moo, a dog's woof, a cat's meow, a duck's quack and a lion's roar. Kuchu Puchu has an Animal Sounds topic for short videos where kids hear and copy sounds like these. Make a sound yourself and let your child guess the animal."
      },
      {
        q: "Are Kuchu Puchu animal videos safe for young kids?",
        a: "Kuchu Puchu is made only for children aged 3 to 8, and every video is reviewed by the team before it goes live. Violence and scary content are not allowed, and that includes frightening animal scenes. There are no ads, comments are turned off, and parents can report any video."
      },
      {
        q: "Can my child learn animal names in Hindi or other languages?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more, and a grown-up can choose which languages to show. The animal videos you see depend on the languages you pick. You can also say each animal's name in your home language as you watch."
      },
      {
        q: "Can animal videos help my child learn to care for a pet?",
        a: "They can be a good start. The Kuchu Puchu Pet Care for Kids topic is for videos about gentle ways to feed, play with and look after pets. Watch together, then let your child help with a small, safe job, like filling a water bowl, while you stay close."
      }
    ],
    related: [
      "science-nature",
      "our-world",
      "early-learning",
      "rhymes-songs"
    ]
  },
  {
    dbSlug: "arts-crafts",
    h1: "Kuchu Puchu Drawing: How to Draw Kuchu & Puchu (Easy)",
    intro: "Kuchu Puchu drawing is easy drawing for kids, step by step. Below you can learn how to draw Kuchu and Puchu, the two friends in the Kuchu Puchu app icon, in six simple steps each, and print a free coloring page. There are also short drawing, coloring, painting and craft videos for children aged 3 to 8, and every one is reviewed before it goes live. For any craft with scissors or glue, a grown-up should help.",
    videosHeading: "Watch Kuchu Puchu Drawing and Craft Videos",
    topicsHeading: "Drawing and Craft Topics Kids Love",
    topicsText: "Choose a topic to find videos on easy crafts, drawing, coloring, painting, paper craft and origami, or clay and dough. Start with the one your child enjoys most, then try something new.",
    learnHeading: "What Kids Learn from Kuchu Puchu Drawing Videos",
    learn: [
      {
        title: "Shapes Into Pictures",
        text: "Kids see how circles, lines and triangles can turn into a cat, a house or a sun, which makes drawing feel easy and possible."
      },
      {
        title: "Colors and Mixing",
        text: "Coloring and painting help kids name colors, choose colors for a picture and see what happens when two paint colors mix together."
      },
      {
        title: "Careful Hand Movements",
        text: "Holding a crayon, folding paper and rolling dough give small hands lots of practice with slow, careful and steady movements."
      },
      {
        title: "Following Steps",
        text: "Crafts are made one step at a time. Kids practice watching, pausing and doing each step in order, from the first fold to the finished craft."
      },
      {
        title: "Using Their Imagination",
        text: "After copying a picture, kids can change it: add a hat, pick new colors or invent a new animal. Every child's drawing can look different."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Drawing Videos in the App",
    ctaText: "Open the free Kuchu Puchu app to watch drawing and craft videos with no ads, then pause anytime to draw along.",
    tipsHeading: "How to Enjoy Drawing and Crafts at Home",
    tips: [
      {
        title: "Get Supplies Ready First",
        text: "Before you press play, set out paper, crayons or paint and cover the table. Your child can then draw along right away instead of waiting while you look for things."
      },
      {
        title: "Help With Scissors and Glue",
        text: "Use child-safe scissors and washable glue, and stay close for any cutting or sticking. Let your child do the easy parts while you handle the tricky ones."
      },
      {
        title: "Praise the Effort",
        text: "Ask your child to tell you about their picture instead of fixing it. Show their work on a wall or the fridge so they feel proud and want to make more."
      }
    ],
    drawingGuide: true,
    faqs: [
      {
        q: "How do you draw Kuchu Puchu easily?",
        a: "Start with a big circle for the head and two small half-circles for the ears. Add the hair, two big oval eyes, pink cheeks and a wide smile, then a rounded T-shirt below. Kuchu has spiky brown hair and a yellow T-shirt; Puchu has a ponytail, a red bow and a pink T-shirt. The step-by-step guide on this page shows each step."
      },
      {
        q: "Is there a Kuchu Puchu coloring page?",
        a: "Yes. This page has a free Kuchu and Puchu coloring page you can open and print. Your child can colour them like the app icon (brown hair, a yellow and a pink T-shirt, a red bow) or in any colours they like."
      },
      {
        q: "How do I teach my child to draw?",
        a: "Start with simple shapes like circles, lines and squares, then show how they join to make pictures. Short Kuchu Puchu drawing videos can help, because your child can watch a step, pause and try it. Keep paper and crayons nearby, and praise trying, not perfect lines."
      },
      {
        q: "What are some easy crafts for kids at home?",
        a: "Easy crafts for kids include paper folding, simple cards, paper plate faces and shapes made from play dough. Kuchu Puchu has topics for paper craft and origami, and for clay and dough, so you can look for ideas there. Choose crafts with few steps and things you already have at home."
      },
      {
        q: "Can my child do Kuchu Puchu crafts alone?",
        a: "A grown-up should help with any step that uses scissors or glue. Kuchu Puchu videos are reviewed before they go live and are not allowed to promote products or link to outside sites. Use child-safe scissors and washable glue, and keep small craft pieces away from very young children."
      },
      {
        q: "What does my child need for drawing and coloring?",
        a: "Simple things are enough: paper, crayons or colored pencils, and an eraser. For painting, washable paints, a brush and an old shirt are helpful. Kuchu Puchu drawing videos are short, so your child can watch, pause and draw along with whatever you have at home."
      },
      {
        q: "Are Kuchu Puchu drawing videos free?",
        a: "Yes. Kuchu Puchu drawing and craft videos are free to watch on the website and in the Kuchu Puchu app. There is no subscription, no in-app purchases and no ads, and kids can watch without an account."
      }
    ],
    related: [
      "early-learning",
      "toys-play",
      "kids-cooking",
      "cartoons-animation"
    ]
  },
  {
    dbSlug: "dance-movement",
    h1: "Kuchu Puchu Dance Videos for Kids",
    intro: "Kuchu Puchu dance videos for kids are made for moving, with dance-along songs, freeze dance and movement games, and simple kids yoga. The videos are short, free and made for children aged 3 to 8, so they fit well into a quick break at home. Clear a safe space, press play and let little bodies get moving.",
    videosHeading: "Watch Kuchu Puchu Dance Videos",
    topicsHeading: "Dance and Movement Topics Kids Love",
    topicsText: "Pick a topic to find kids dance videos, freeze dance and movement games, kids yoga or simple exercise for kids. Try a lively dance first, then a calm yoga stretch to finish.",
    learnHeading: "What Kids Learn from Kuchu Puchu Dance Videos",
    learn: [
      {
        title: "Rhythm and Beat",
        text: "Kids clap, stomp and step to the music, and start to feel when a song is fast or slow, loud or soft."
      },
      {
        title: "Listening and Stopping",
        text: "Freeze dance games ask kids to listen closely and stop when the music stops, a playful way to practice paying attention."
      },
      {
        title: "Copying Moves",
        text: "Kids watch a move, then copy it: arms up, turn around, jump. Doing moves in order is good practice for remembering simple steps."
      },
      {
        title: "Body Parts and Directions",
        text: "Moving along to dance and yoga is a natural way to practice words like up, down, left, right, head and toes."
      },
      {
        title: "Stretching and Calm Breathing",
        text: "Kids yoga is about simple stretches and slow breaths, giving children a calm way to settle down after a busy, active dance."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Dance Videos in the App",
    ctaText: "Play dance-along and kids yoga videos in the free Kuchu Puchu app, with no ads to interrupt the music.",
    tipsHeading: "How to Enjoy Dance Videos at Home",
    tips: [
      {
        title: "Clear a Safe Space",
        text: "Move chairs, toys and anything sharp out of the way, and dance on a floor that is not slippery. Bare feet are often safer than smooth socks."
      },
      {
        title: "Dance Together",
        text: "Join in and copy the moves with your child. Kids love it when grown-ups dance too, and you can slow down any move that feels too fast."
      },
      {
        title: "End With Something Calm",
        text: "After a lively dance, finish with a short yoga stretch or a few slow breaths together. This helps the dance break end gently before the next activity."
      }
    ],
    faqs: [
      {
        q: "What are good dance songs for kids?",
        a: "Good dance songs for kids have a clear beat, simple moves and words that tell kids what to do, like clap, jump or spin. Kuchu Puchu dance videos are short and made for young children, so they are easy to follow from start to end."
      },
      {
        q: "What is freeze dance?",
        a: "Freeze dance is a game where kids dance while the music plays and freeze like a statue when it stops. It is simple, fun and a good way to practice listening. Kuchu Puchu has a Freeze Dance & Games topic for videos like this, and you can also play it at home by pausing any song."
      },
      {
        q: "Can young kids do yoga?",
        a: "Yes, many young kids enjoy simple yoga poses and slow breathing when it is gentle and playful. The Kuchu Puchu Kids Yoga topic is for easy stretches made for young children. Use a soft mat or rug, never force a pose, and stop if your child feels uncomfortable."
      },
      {
        q: "How much space do kids need to dance at home?",
        a: "A small, clear area is enough: your child should be able to stretch out their arms and turn around without touching anything. Move furniture and toys away, avoid slippery floors, and keep a grown-up nearby. Kuchu Puchu dance videos are short, so a quick dance break fits easily into a small room."
      },
      {
        q: "Are Kuchu Puchu dance videos free and ad-free?",
        a: "Yes. Kuchu Puchu dance and yoga videos are free to watch on the website and in the Kuchu Puchu app. There are no ads, no subscription and no in-app purchases, so the music is never stopped by an ad. Kids can watch without an account."
      }
    ],
    related: [
      "rhymes-songs",
      "sports-play",
      "good-habits",
      "kids-comedy"
    ]
  },
  {
    dbSlug: "kids-comedy",
    h1: "Kuchu Puchu Funny Videos for Kids",
    intro: "Kuchu Puchu funny videos for kids bring gentle, silly comedy for little ones, from silly sketches and funny animals to riddles, jokes and puppet shows. The videos are short, free and made for children aged 3 to 8. Every video is reviewed before it goes live, and there are no pranks, stunts or bad language.",
    videosHeading: "Watch Kuchu Puchu Funny Videos",
    topicsHeading: "Funny Topics Kids Love",
    topicsText: "Choose a topic to find silly sketches, funny animals, riddles and kids jokes, or puppet shows. Each one is a different way to laugh together.",
    learnHeading: "What Kids Learn from Kuchu Puchu Funny Videos",
    learn: [
      {
        title: "Spotting What Is Silly",
        text: "Kids notice when something is wrong in a funny way, like a cat that barks or shoes on hands, and enjoy saying what should happen instead."
      },
      {
        title: "Riddles and Thinking",
        text: "Riddles ask kids to listen to clues and guess the answer, a playful way to practice thinking and learn new words."
      },
      {
        title: "Telling Jokes",
        text: "Simple kids jokes give children a short line to remember and share, so they practice speaking clearly and waiting for the laugh."
      },
      {
        title: "Feelings and Faces",
        text: "Puppets and silly characters show big, clear feelings, helping kids name happy, surprised, silly or grumpy faces and talk about them."
      },
      {
        title: "Kind Ways to Have Fun",
        text: "Because there are no pranks or stunts, kids see fun where everyone is in on the joke and no one gets tricked or hurt."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Funny Videos in the App",
    ctaText: "Share a laugh with gentle funny videos in the free Kuchu Puchu app, with no ads and no comments.",
    tipsHeading: "How to Enjoy Funny Videos at Home",
    tips: [
      {
        title: "Laugh Together",
        text: "Watch with your child and laugh out loud. Then ask, \"What was the silliest part?\" Talking about the joke helps your child explain what they saw and why it was funny."
      },
      {
        title: "Have a Joke Time",
        text: "After a riddle or joke video, take turns telling your own. Simple ones are best, and it is fine if your child's joke makes no sense. Laugh anyway."
      },
      {
        title: "Make a Sock Puppet",
        text: "Turn an old sock into a puppet by drawing eyes and a mouth with a marker, then put on your own funny show. Let your child choose the voice and the story."
      }
    ],
    faqs: [
      {
        q: "What makes a video funny for young kids?",
        a: "Young kids laugh most at simple, silly things: funny faces, silly sounds, animals doing surprising things and small mix-ups that hurt no one. Kuchu Puchu funny videos are made for children aged 3 to 8, so the comedy is gentle and easy for little ones to understand."
      },
      {
        q: "Do Kuchu Puchu funny videos have pranks?",
        a: "No. Pranks and stunts are not allowed in Kuchu Puchu funny videos, and every video is reviewed by the team before it goes live. Videos also cannot include violence, scary content, adult content or bad language. If you ever see something that feels wrong, you can report the video."
      },
      {
        q: "What are some easy riddles and jokes for kids?",
        a: "Easy riddles for kids use things they already know. Try \"What has ears but cannot hear? Corn!\" or \"What has hands but cannot clap? A clock!\" The Kuchu Puchu Riddles & Kids Jokes topic is for short videos with riddles and jokes like these that kids can repeat and share."
      },
      {
        q: "Why are puppet shows good for kids?",
        a: "Puppet shows are a gentle way for kids to enjoy a story, see clear feelings and hear voices they can copy. Afterwards, kids can make their own puppets and put on a show at home. Kuchu Puchu has a Puppet Shows topic for short, silly puppet videos made for young children."
      },
      {
        q: "Are Kuchu Puchu funny videos free?",
        a: "Yes. Kuchu Puchu funny videos are free to watch on the website and in the Kuchu Puchu app. There is no subscription, no in-app purchases and no ads. Comments are turned off, and kids can watch without an account."
      }
    ],
    related: [
      "cartoons-animation",
      "stories",
      "animals",
      "toys-play"
    ]
  },
  {
    dbSlug: "toys-play",
    h1: "Kuchu Puchu Toys and Play Videos for Kids",
    intro: "Kuchu Puchu toys and play videos for kids are about playing, not buying, with toy stories, building blocks, pretend play, puzzles and board games. The videos are short, free and made for children aged 3 to 8. There are no unboxing ads or product promotion, so the focus stays on play ideas kids can try with toys they already have.",
    videosHeading: "Watch Kuchu Puchu Toys and Play Videos",
    topicsHeading: "Toy and Play Topics Kids Love",
    topicsText: "Pick a topic to find toy stories, building blocks, pretend play, or puzzles and board games. Each topic is a different way to play, think and imagine.",
    learnHeading: "What Kids Learn from Kuchu Puchu Play Videos",
    learn: [
      {
        title: "Imagination and Pretend",
        text: "Pretend play shows how a box can be a car or a spoon can be a microphone, inviting kids to invent their own games."
      },
      {
        title: "Building and Balancing",
        text: "Building with blocks helps kids think about size, shape and balance, and try again when a tall tower falls down."
      },
      {
        title: "Puzzle Thinking",
        text: "Puzzles ask kids to look closely, turn pieces and test where they fit, a fun way to practice patience and problem solving."
      },
      {
        title: "Taking Turns and Rules",
        text: "Board games are about waiting for a turn, following simple rules and staying kind whether you win or lose."
      },
      {
        title: "Telling Stories With Toys",
        text: "Toy stories give kids ideas for giving their own toys voices, so they practice putting words and events in order to tell a story."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Play Videos in the App",
    ctaText: "Watch toys and play videos in the free Kuchu Puchu app, with no ads, no unboxing promotions and no in-app purchases.",
    tipsHeading: "How to Enjoy Toys and Play at Home",
    tips: [
      {
        title: "Play Right After Watching",
        text: "Keep a few toys, blocks or a simple puzzle nearby. After a short video, turn off the screen and try the idea together while it is still fresh."
      },
      {
        title: "Use What You Have",
        text: "Pretend play needs no new toys. Boxes, cups, spoons and old clothes can become a shop, a kitchen or a rocket. Let your child lead the game."
      },
      {
        title: "Play a Board Game Together",
        text: "Choose a simple game with few rules. Take turns, count out loud and show how to be a kind winner and a good loser. Short games work best."
      }
    ],
    faqs: [
      {
        q: "Are Kuchu Puchu toy videos just unboxing ads?",
        a: "No. Kuchu Puchu toys and play videos have no unboxing ads or product promotion, and they cannot link to outside shops or sites. The focus is on play: pretend games, building, puzzles and board games. Every video is reviewed by the Kuchu Puchu team before it goes live."
      },
      {
        q: "What is pretend play and why do kids love it?",
        a: "Pretend play is when kids act out ideas, like running a shop, cooking a meal or flying to the moon. It lets them try being someone else and make up their own stories. The Kuchu Puchu Pretend Play topic is for short videos that give kids new ideas to play at home."
      },
      {
        q: "What are good building block ideas for kids?",
        a: "Start simple: build a tall tower, a bridge for a toy car, a house or a zoo for toy animals. Count the blocks and sort them by color as you go. Kuchu Puchu has a Building Blocks topic for short videos that share easy building ideas for young children."
      },
      {
        q: "What puzzles and board games suit kids aged 3 to 8?",
        a: "Younger kids often enjoy big-piece puzzles, matching games and simple board games that use dice and have few rules. Older kids can try puzzles with more pieces and games that need a little planning. Kuchu Puchu has a Puzzles & Board Games topic for videos about playing together."
      },
      {
        q: "Are Kuchu Puchu toys and play videos free?",
        a: "Yes. Kuchu Puchu toys and play videos are free to watch on the website and in the Kuchu Puchu app. There is no subscription, no in-app purchases and no ads, and videos are not allowed to promote products. Kids can watch without an account."
      }
    ],
    related: [
      "arts-crafts",
      "stories",
      "early-learning",
      "sports-play"
    ]
  },
  {
    dbSlug: "our-world",
    h1: "Kuchu Puchu Our World Videos for Kids",
    intro: "Kuchu Puchu Our World videos for kids are short, gentle clips about festivals, cultures, places, community helpers and vehicles. They are made for children aged 3 to 8 who are curious about the people, places and machines around them. Every video is free, has no ads and is checked by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Our World Videos",
    topicsHeading: "Our World Topics for Little Ones",
    topicsText: "Pick a topic to explore one part of the world at a time. Kids can learn about family adventures, festivals, countries and cultures, community helpers, vehicles and places to visit.",
    learnHeading: "What Kids Learn from Kuchu Puchu Our World Videos",
    learn: [
      {
        title: "Festivals and Celebrations",
        text: "Kids discover how families decorate homes, share food, sing and come together to celebrate, and learn to respect festivals that are different from their own."
      },
      {
        title: "Countries and Cultures",
        text: "Children discover that people around the world speak different languages, eat different foods and wear different clothes, and that being different is a good thing."
      },
      {
        title: "Community Helpers and Jobs",
        text: "Kids learn about the people who help us every day, like doctors, nurses, firefighters, police officers, farmers and bus drivers, and how each job helps others."
      },
      {
        title: "Vehicles and What They Do",
        text: "Children learn the names of cars, buses, trains, boats, planes, tractors and diggers, what each one does, and how they help people travel and build."
      },
      {
        title: "Places and Family Trips",
        text: "Kids learn about places like parks, zoos, markets, beaches, mountains and museums, and what they might see there on a family trip."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Our World Videos in the App",
    ctaText: "Open the free Kuchu Puchu app to explore the world in short videos, with no ads and no account needed.",
    tipsHeading: "How to Explore Our World Together at Home",
    tips: [
      {
        title: "Spot Helpers on Walks",
        text: "When you go out, point to the helpers you see, like a bus driver, a shopkeeper or a traffic police officer. Ask your child what each person is doing to help."
      },
      {
        title: "Talk About Your Festivals",
        text: "Before a festival, tell your child why your family celebrates it. Make a simple decoration or card together, and later ask what they enjoyed most."
      },
      {
        title: "Play a Vehicle Game",
        text: "Count buses, bikes or trucks from a window or on a car ride. Name each vehicle together and talk about where it might be going."
      }
    ],
    faqs: [
      {
        q: "What are Our World videos for kids?",
        a: "Our World videos are short, gentle clips about the world around children: festivals, cultures, countries, community helpers, vehicles and places to visit. On Kuchu Puchu, they are made for kids aged 3 to 8 and are free to watch, with no ads."
      },
      {
        q: "How do I teach my child about community helpers?",
        a: "Start with the helpers your child already sees, like a doctor, teacher, farmer or bus driver. Name each one, talk about how they help, and play pretend together. The Community Helpers topic on Kuchu Puchu is for short videos that can support these everyday talks."
      },
      {
        q: "How can I teach my child about different festivals and cultures?",
        a: "Start with your own family's festivals, then talk about the festivals of friends and neighbors. Look at pictures, make a simple craft, and keep the talk kind and curious. The Festivals & Celebrations and Countries & Cultures topics on Kuchu Puchu are for short videos that can start these talks."
      },
      {
        q: "Why do young kids love vehicles and machines?",
        a: "Vehicles are big, loud, moving and easy to spot, so many young children find them exciting. Naming cars, trucks, trains and diggers is a fun way to learn new words and colors. The Vehicles & Machines topic on Kuchu Puchu is for short, simple videos about how they work and what they do."
      },
      {
        q: "Are Our World videos on Kuchu Puchu safe for young kids?",
        a: "Yes, they are made with young children in mind. Every Kuchu Puchu video is reviewed by the team before it goes live, and the rules ban violence, scary or adult content, bad language, ads, product promotion and links to outside sites. Comments are turned off, and parents can report any video."
      }
    ],
    related: [
      "learn-languages",
      "stories",
      "science-nature",
      "good-habits"
    ]
  },
  {
    dbSlug: "good-habits",
    h1: "Kuchu Puchu Good Habits Videos for Kids",
    intro: "Kuchu Puchu Good Habits videos for kids are short clips about good manners, healthy habits, healthy eating, staying safe and understanding feelings. They are made for children aged 3 to 8 and focus on everyday moments, like washing hands, sharing toys or saying sorry. Every video is free, has no ads and is checked by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Good Habits Videos",
    topicsHeading: "Good Habits Topics for Little Ones",
    topicsText: "Choose a topic to focus on one habit at a time. Topics cover good manners, healthy habits, healthy eating, staying safe, and feelings and kindness.",
    learnHeading: "What Kids Learn from Kuchu Puchu Good Habits Videos",
    learn: [
      {
        title: "Polite Words and Manners",
        text: "Kids practice saying please, thank you and sorry, waiting for their turn, sharing toys and greeting family and friends in a kind way."
      },
      {
        title: "Everyday Healthy Habits",
        text: "Kids learn simple daily routines like washing hands before meals, brushing teeth, bath time, tidying toys and getting ready for bed."
      },
      {
        title: "Healthy Eating Basics",
        text: "Children learn the names of fruits and vegetables, why we eat a mix of foods, and that it is okay to try a small bite of something new."
      },
      {
        title: "Simple Safety Rules",
        text: "Kids learn gentle safety basics, like holding a grown-up's hand near roads, wearing a seat belt and asking a trusted grown-up for help."
      },
      {
        title: "Naming Feelings, Showing Kindness",
        text: "Kids learn to name feelings like happy, sad, angry and scared, take a calm breath when upset, and notice when a friend needs kindness."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Good Habits Videos in the App",
    ctaText: "Watch good habits videos in the free Kuchu Puchu app, with no ads, no in-app purchases and comments turned off.",
    tipsHeading: "How to Build Good Habits at Home",
    tips: [
      {
        title: "Show, Don't Just Tell",
        text: "Children copy what they see. Say please and thank you, wash your hands with them, and tidy up together. Your example is the easiest lesson to follow."
      },
      {
        title: "Make It a Routine",
        text: "Do habits at the same time each day, like brushing teeth in the morning and before bed. A simple picture chart or a short song can make it fun."
      },
      {
        title: "Praise Small Steps",
        text: "Notice and praise effort, not just results. Saying \"You shared so nicely!\" helps children feel proud. Be patient, because new habits take time for everyone."
      }
    ],
    faqs: [
      {
        q: "What are good habits videos for kids?",
        a: "Good habits videos are short clips that show young children everyday skills like good manners, washing hands, healthy eating, staying safe and being kind. On Kuchu Puchu, they are made for kids aged 3 to 8, free to watch and have no ads. Every video is reviewed before it goes live."
      },
      {
        q: "How do I teach my child good manners?",
        a: "Start with a few words, like please, thank you and sorry, and use them yourself every day. Praise your child when they try, and gently remind them when they forget. The Good Manners topic on Kuchu Puchu is for short videos you can watch together and talk about."
      },
      {
        q: "How can I help my child understand their feelings?",
        a: "Help your child put a name to each feeling, like happy, sad, angry or worried, and tell them all feelings are okay. Talk about your own feelings too, and show calm ways to cope, like a deep breath or a hug. The Feelings & Kindness topic on Kuchu Puchu is made for this."
      },
      {
        q: "How do I teach my child about safety without scaring them?",
        a: "Keep safety lessons short, calm and positive. Focus on simple rules, like holding a grown-up's hand near roads, wearing a seat belt and asking a trusted grown-up for help. Practice them on everyday outings. The Staying Safe topic on Kuchu Puchu is meant for gentle, friendly lessons like these."
      },
      {
        q: "How do I encourage my child to try new foods?",
        a: "Offer small amounts of a new food next to foods your child already likes, and stay relaxed if they say no. Eat together, let them help wash fruits and vegetables, and try again another day. The Healthy Eating topic on Kuchu Puchu is for short videos about fruits, vegetables and family mealtimes."
      }
    ],
    related: [
      "stories",
      "kids-cooking",
      "sports-play",
      "our-world"
    ]
  },
  {
    dbSlug: "kids-cooking",
    h1: "Kuchu Puchu Cooking Videos for Kids",
    intro: "Kuchu Puchu Cooking videos for kids are short clips about simple, safe recipes children can make with a grown-up, like easy snacks and fruit plates. They are made for children aged 3 to 8 who love to help in the kitchen, always with a grown-up beside them. Like all Kuchu Puchu videos, they are free, ad-free and reviewed before they go live.",
    videosHeading: "Watch Kuchu Puchu Cooking Videos",
    topicsHeading: "Cooking Topics for Little Chefs",
    topicsText: "Pick a topic to find an easy idea to try together. Topics include easy snacks, no-cook recipes, fruit and veggie fun, and baking with a grown-up.",
    learnHeading: "What Kids Learn from Kuchu Puchu Cooking Videos",
    learn: [
      {
        title: "Following Simple Steps",
        text: "Kids learn to follow a recipe one step at a time, listen carefully, wait their turn and finish a small task from start to end."
      },
      {
        title: "Counting and Measuring",
        text: "Counting spoons, cups and pieces of fruit is fun math practice, and kids learn ideas like more, less, full, empty and half."
      },
      {
        title: "Kitchen Safety Rules",
        text: "Kids learn to wash hands first, ask before touching anything, and leave knives, the stove and the oven to a grown-up."
      },
      {
        title: "Fruits, Veggies and Senses",
        text: "Children learn the names, colors, shapes and smells of fruits and vegetables, and use their senses to explore new tastes with curiosity."
      },
      {
        title: "Helping and Cleaning Up",
        text: "Kids learn to help with small jobs, like stirring a bowl, pouring, setting the table and wiping up, and feel proud of what they make together."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Cooking Videos in the App",
    ctaText: "Watch cooking videos in the free Kuchu Puchu app, then try the easy recipes together with a grown-up in your own kitchen.",
    tipsHeading: "How to Cook Safely with Kids at Home",
    tips: [
      {
        title: "Give Kid-Sized Jobs",
        text: "Let your child wash fruit, tear lettuce, stir a bowl, spread butter with a spoon or arrange a plate. Keep knives, the stove and the oven as grown-up jobs."
      },
      {
        title: "Get Ready Together",
        text: "Before you start, wash hands, tie back long hair and put out everything you need. Check ingredients for allergies, and choose a short recipe so little ones stay interested."
      },
      {
        title: "Enjoy the Mess",
        text: "Spills and lumpy shapes are part of learning. Praise your child's effort, clean up together, and enjoy eating what you made side by side."
      }
    ],
    faqs: [
      {
        q: "What can kids cook without a stove?",
        a: "Many simple foods need no stove at all, like fruit salad, yogurt bowls, sandwiches, wraps and veggie faces on a plate. A grown-up should do any cutting first and check ingredients for allergies. The No-Cook Recipes topic on Kuchu Puchu is for short videos with easy ideas like these."
      },
      {
        q: "How can young kids help in the kitchen?",
        a: "Young children can help with small, safe jobs like washing fruit, stirring a bowl, pouring, or arranging food on a plate, with a grown-up right beside them. Kuchu Puchu Cooking videos are made for kids aged 3 to 8 and are meant to be followed with a grown-up, never alone."
      },
      {
        q: "How do I keep my child safe while cooking?",
        a: "Stay with your child the whole time and give them only kid-sized jobs. Grown-ups handle knives, the stove, the oven and anything hot. Wash hands first, wipe spills quickly and check ingredients for allergies. Kuchu Puchu Cooking is for recipes kids make together with a grown-up."
      },
      {
        q: "What are easy snacks kids can make?",
        a: "Easy snacks for kids include fruit cups, banana and yogurt bowls, cheese and cracker stacks, and colorful veggie plates with a dip. A grown-up should do any cutting and check ingredients for allergies. The Easy Snacks topic on Kuchu Puchu is for short videos with simple snack ideas to make together."
      },
      {
        q: "Can young kids help with baking?",
        a: "Yes, with a grown-up. Kids can measure, pour, mix and shape dough, while the grown-up handles the oven, hot trays and anything sharp. Pick simple recipes with few steps, and remind kids not to eat raw dough. The Baking with a Grown-up topic on Kuchu Puchu is for short videos made for this teamwork."
      }
    ],
    related: [
      "good-habits",
      "arts-crafts",
      "early-learning",
      "our-world"
    ]
  },
  {
    dbSlug: "learn-languages",
    h1: "Kuchu Puchu Languages: Learn Hindi, English & Punjabi for Kids",
    intro: "Kuchu Puchu Language videos for kids are short clips about first words and simple phrases in Hindi, English, Punjabi, Urdu and more. They are made for children aged 3 to 8, whether your child is starting to learn Hindi, picking up English words, or enjoying a home language. Every video is free and ad-free, a grown-up can choose which languages to show, and the Hindi, Punjabi and English pages gather every video in one language.",
    videosHeading: "Watch Kuchu Puchu Language Videos",
    topicsHeading: "Language Topics for Little Ones",
    topicsText: "Choose a topic to focus on one language at a time, or mix two together. Topics include Learn English, Learn Hindi, Learn Punjabi, Learn Urdu, Learn Other Languages and Bilingual Stories.",
    learnHeading: "What Kids Learn from Kuchu Puchu Language Videos",
    learn: [
      {
        title: "First Everyday Words",
        text: "Kids hear and repeat simple words for things they see every day, like family, food, colors, animals, body parts and things at home."
      },
      {
        title: "Simple Polite Phrases",
        text: "Children practice short phrases like hello, thank you, please and goodbye, to greet people and use kind words in more than one language."
      },
      {
        title: "Listening and Copying Sounds",
        text: "Kids learn to listen closely to new sounds, copy how words are spoken, and notice that the same thing can have different names in different languages."
      },
      {
        title: "Love for Home Languages",
        text: "Hearing a home language, like the one grandparents speak, can help kids feel close to family and proud of where they come from."
      },
      {
        title: "New Words Through Stories",
        text: "Bilingual stories let kids hear the same idea in two languages, helping them learn new words while they enjoy a simple story."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Language Videos in the App",
    ctaText: "In the free Kuchu Puchu app, a grown-up can choose which languages to show, so kids see videos in the languages your family uses.",
    tipsHeading: "How to Help Kids Learn Languages at Home",
    tips: [
      {
        title: "Use Words Every Day",
        text: "Pick a few new words each week and use them during meals, bath time or play. Point to real objects as you say them, so kids link each word to something real."
      },
      {
        title: "Sing, Read and Repeat",
        text: "Songs, rhymes and short stories are easy ways to hear a language again and again. Repeat favorites often, because little ones love to hear the same thing many times."
      },
      {
        title: "Keep It Fun",
        text: "Praise every try, even if a word comes out wrong. Gently say the word back the right way, and keep home languages alive by speaking them often with your child."
      }
    ],
    faqs: [
      {
        q: "How can I teach my child Hindi at home?",
        a: "Start small with everyday Hindi words for family, food, colors and greetings, and use them during daily routines. Sing simple songs, read picture books and praise every try. On Kuchu Puchu, the Learn Hindi topic is for short videos that add fun practice, and a grown-up can choose which languages to show."
      },
      {
        q: "What English words should kids learn first?",
        a: "Good first English words are ones kids use every day: family words, body parts, colors, numbers, animals, food and polite words like please and thank you. Learn a few at a time and use them often. The Learn English topic on Kuchu Puchu is for short videos about first words like these."
      },
      {
        q: "What are bilingual stories for kids?",
        a: "Bilingual stories tell a simple story using two languages, such as Hindi and English, so kids hear words they know next to new ones. They are a gentle way to hear new words and enjoy a family language. The Bilingual Stories topic on Kuchu Puchu is for short stories like these."
      },
      {
        q: "Which languages is Kuchu Puchu in?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more. A grown-up can choose which languages to show, so your child sees videos in the languages your family speaks or wants to learn. Language settings in the app are behind a check for grown-ups."
      },
      {
        q: "Is Kuchu Puchu available in Hindi?",
        a: "Yes. Kuchu Puchu has many videos in Hindi (हिन्दी): cartoons, poems, good values and first words, for kids aged 3 to 8. The Kuchu Puchu Hindi videos page shows them all in one place, and in the app a grown-up can choose Hindi as a language to show."
      },
      {
        q: "How can videos help my child learn new words?",
        a: "Short videos give kids a fun way to hear new words and see what they mean. Watch together when you can, pause to say words out loud, and use them later at home. Kuchu Puchu Language videos are short, free and ad-free, so they fit easily into a quick, shared watch."
      }
    ],
    related: [
      "lang-hi",
      "lang-pa",
      "lang-en",
      "alphabets"
    ]
  },
  {
    dbSlug: "sports-play",
    h1: "Kuchu Puchu Sports Videos for Kids",
    intro: "Kuchu Puchu Sports videos for kids are short clips about active outdoor play and first sports skills, like running games, ball games, playground fun, cycling and skating. They are made for children aged 3 to 8, and the idea is always to play safely, with a grown-up nearby. Like all Kuchu Puchu videos, they are free, have no ads and are reviewed before they go live.",
    videosHeading: "Watch Kuchu Puchu Sports Videos",
    topicsHeading: "Sports and Play Topics for Little Ones",
    topicsText: "Pick a topic to find a new way to move and play. Topics include outdoor games, ball games, playground fun, and cycling and skating.",
    learnHeading: "What Kids Learn from Kuchu Puchu Sports Videos",
    learn: [
      {
        title: "Throwing, Catching and Kicking",
        text: "Kids learn basic ball skills like rolling, throwing, catching and kicking, and practice keeping their eyes on the ball as it moves."
      },
      {
        title: "Running, Jumping and Balance",
        text: "Kids try running, jumping, hopping and balancing games, and learn how their bodies move in fun, playful ways."
      },
      {
        title: "Taking Turns and Teamwork",
        text: "Games with friends are a chance to take turns, follow simple rules, cheer for others and be a kind winner or a good loser."
      },
      {
        title: "Safe Play Habits",
        text: "Kids learn simple safety habits, like wearing a helmet for cycling and skating, playing in safe spaces and staying where a grown-up can see them."
      },
      {
        title: "Playground Skills",
        text: "On swings, slides and climbing frames, kids learn to wait their turn, try new things step by step and ask a grown-up for help."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Sports Videos in the App",
    ctaText: "Watch sports and play videos in the free Kuchu Puchu app, then try the moves together in a safe, open space.",
    tipsHeading: "How to Help Kids Play Safely and Stay Active",
    tips: [
      {
        title: "Choose a Safe Space",
        text: "Play in a park, playground or open yard, away from roads and traffic. Check the ground for sharp or slippery spots, and stay close enough to help."
      },
      {
        title: "Gear Up for Wheels",
        text: "For cycling, scooters and skating, a well-fitted helmet is a must. Knee and elbow pads add extra protection. Start on flat, quiet paths and go slowly at first."
      },
      {
        title: "Play Together, Keep It Fun",
        text: "Join in the game, cheer every try, and keep it about fun, not winning. Offer water breaks and rest in the shade on hot days."
      }
    ],
    faqs: [
      {
        q: "What are good outdoor games for kids aged 3 to 8?",
        a: "Simple outdoor games like tag, hide and seek, hopscotch, follow the leader, ball rolling and running races are great for young kids. They need little or no equipment. Always play in a safe space with a grown-up nearby. The Outdoor Games topic on Kuchu Puchu is for short videos with ideas like these."
      },
      {
        q: "How can I teach my child to catch and throw a ball?",
        a: "Start with a big, soft ball and stand close together. Roll it first, then gently toss it, and slowly step back as your child gets better. Praise every try, even the misses. The Ball Games topic on Kuchu Puchu is for short videos about first ball skills."
      },
      {
        q: "How do I help my child learn to ride a bike safely?",
        a: "Start with a helmet that fits well, and practice on a flat, quiet path away from traffic. A balance bike or training wheels can make the first steps easier. Stay close, go slowly and celebrate small wins. The Cycling & Skating topic on Kuchu Puchu is for short videos about riding safely."
      },
      {
        q: "How do I keep my child safe at the playground?",
        a: "Stay close and keep your child in sight at all times. Check that equipment suits their age and size, look for soft ground under swings and slides, and teach simple rules like waiting for a turn and going down slides feet first. The Playground Fun topic on Kuchu Puchu is for short videos about playing safely and kindly."
      },
      {
        q: "How can I get my child to be more active?",
        a: "Make moving part of everyday fun. Walk to the park, dance at home, play catch or build a simple obstacle course with cushions. Join in, because many kids love playing with grown-ups. Kuchu Puchu Sports videos are short, so you can watch one together and then go play for real."
      }
    ],
    related: [
      "dance-movement",
      "toys-play",
      "good-habits",
      "our-world"
    ]
  },
  // ── 10 more categories (added 2026-11) ──
  {
    dbSlug: "school-classroom",
    h1: "Kuchu Puchu School & Classroom Cartoons for Kids",
    intro: "Kuchu Puchu School & Classroom is the home of school cartoons for kids, full of funny classroom moments, animal teachers and little lessons. In the Jungle School cartoons, kids join Lion Teacher's class of animal students for lessons, poems and plenty of giggles. These classroom cartoons are made for children aged 3 to 8 and are short, so it is easy to enjoy one or two and then go and play.",
    videosHeading: "Watch Kuchu Puchu School Cartoons",
    topicsHeading: "School Cartoon Topics Kids Love",
    topicsText: "Pick a topic to find the kind of classroom cartoon your child enjoys most, from silly mix-ups in class to gentle lessons and good manners. Topics include Classroom Comedy, Animal School, Fun School Lessons, First Day at School and School Manners.",
    learnHeading: "What Kids Learn from Kuchu Puchu School Cartoons",
    learn: [
      {
        title: "What School Is Like",
        text: "A cartoon classroom shows kids what happens at school: a teacher, a class of friends, lessons, questions and taking turns to speak."
      },
      {
        title: "Classroom Manners",
        text: "Kids see simple school manners, like greeting the teacher, raising a hand, listening quietly and waiting their turn, in a fun and easy way."
      },
      {
        title: "Little Lessons While Laughing",
        text: "Fun school lessons can be about counting, colors, the weather, poems or new words, so kids pick up something new while they laugh."
      },
      {
        title: "Mistakes Are Okay",
        text: "When a cartoon student gives a funny wrong answer, kids see that everyone makes mistakes and that trying again is part of learning."
      },
      {
        title: "Feeling Brave About School",
        text: "The First Day at School topic is about feeling shy or a little worried, and about how a kind teacher and new friends can help."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu School Cartoons in the App",
    ctaText: "Join the class with Kuchu Puchu school cartoons in the free app for Android and iPhone, or watch them right here on the website.",
    tipsHeading: "How to Enjoy School Cartoons at Home",
    tips: [
      {
        title: "Play School Together",
        text: "After a classroom cartoon, let your child be the teacher. Line up toys as the students, take turns asking questions, and let the toys give silly answers for your child to fix."
      },
      {
        title: "Talk About Real School",
        text: "Ask what was the same as your child's own class or playschool, and what was different. It is an easy way to hear about their day, their teacher and their friends."
      },
      {
        title: "Get Ready for a New Start",
        text: "If school is starting soon, talk about what will happen, read a book or watch a classroom cartoon together, and pack the school bag the night before. Knowing what to expect can help little ones feel calmer."
      }
    ],
    faqs: [
      {
        q: "What are school cartoons for kids?",
        a: "School cartoons for kids are short, funny cartoons set in a classroom, where a teacher and students learn, play and sometimes make silly mistakes. Kuchu Puchu school cartoons are made for children aged 3 to 8, with topics for classroom comedy, animal school, fun lessons, the first day at school and school manners."
      },
      {
        q: "What is the Jungle School cartoon?",
        a: "Jungle School is a cartoon series on Kuchu Puchu, set in a school in the jungle, where Lion Teacher teaches a class of animal students. The cartoons mix little lessons and poems with funny classroom moments. Like all Kuchu Puchu videos, they are short, free and made for kids aged 3 to 8."
      },
      {
        q: "Are there animal school cartoons on Kuchu Puchu?",
        a: "Yes. Animal School is one of the topics in Kuchu Puchu School & Classroom. In these cartoons, the students are animals and the teacher might be a lion, a monkey, a crocodile or a gorilla. Many kids enjoy seeing animals act like schoolchildren, and it gives families an easy way to talk about real school."
      },
      {
        q: "Can cartoons help my child get ready for school?",
        a: "They can help. A gentle classroom cartoon shows young kids what school looks like, with a teacher, friends and lessons, and the First Day at School topic is about feeling brave on a new day. Watch together, talk about what your child sees, and visit the school if you can, so they know what to expect."
      },
      {
        q: "Are Kuchu Puchu school cartoons safe for young kids?",
        a: "Kuchu Puchu school cartoons are made by approved creators for children aged 3 to 8, and every video is reviewed by the Kuchu Puchu team before it goes live. The rules do not allow violence, scary or adult content, bad language or ads. Comments are turned off, kids can watch without an account, and parents can report any video."
      }
    ],
    related: [
      "poems",
      "maths",
      "kids-comedy",
      "good-habits"
    ]
  },
  {
    dbSlug: "poems",
    h1: "Kuchu Puchu Poems for Kids in Hindi & English",
    intro: "Kuchu Puchu Poems is the home of poems for kids, with Hindi poems (kavita), English poems and Punjabi poems that children can listen to, say along and learn by heart. Poems are made for saying aloud with a steady rhythm, so they are also a lovely way to practice for a poem recitation at school. The videos are short and made for children aged 3 to 8, with no ads, and every one is reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Poems",
    topicsHeading: "Poem Topics for Little Ones",
    topicsText: "Choose a topic to find the right poem for the moment, from a Hindi kavita to learn by heart to a short, funny poem to giggle at. Topics include Hindi Poems (Kavita), English Poems, Punjabi Poems, Poem Recitation and Short Poems.",
    learnHeading: "What Kids Learn from Kuchu Puchu Poems",
    learn: [
      {
        title: "Rhythm in Spoken Words",
        text: "Poems are usually spoken rather than sung, but they still have a beat. Kids learn to feel the rhythm of each line and say it at a steady pace."
      },
      {
        title: "Memory and Learning by Heart",
        text: "Short lines and rhyming words make poems easier to remember. Learning a whole poem, one line at a time, is good practice for memory."
      },
      {
        title: "Speaking Clearly",
        text: "Reciting a poem helps kids speak slowly and clearly, pause in the right places and show feeling with their voice and face."
      },
      {
        title: "Stage Confidence",
        text: "Practicing a poem at home can help kids feel ready to stand up and recite it in class, at a school function or in a recitation competition."
      },
      {
        title: "New Words and Big Feelings",
        text: "Poems bring new words and simple ideas, from animals and vegetables to a mother's love, and give kids words for the things they feel."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Poems in the App",
    ctaText: "Listen to Kuchu Puchu poems in the free app, pause after each line and say it together until your child knows the whole poem.",
    tipsHeading: "How to Practice Poems at Home",
    tips: [
      {
        title: "One Line at a Time",
        text: "Watch the poem together, then say the first line until it feels easy. Add the next line, join them up, and keep going until your child can say the whole poem."
      },
      {
        title: "Add Simple Actions",
        text: "Make a hand action for each line, like a swinging trunk for an elephant or a big hug for mother. Actions help kids remember the words and make reciting more fun."
      },
      {
        title: "Practice in Front of Family",
        text: "Before a school recitation, let your child recite for the family or a row of soft toys. Remind them to stand straight, speak slowly and smile, and clap for every try."
      }
    ],
    faqs: [
      {
        q: "What is a good Hindi poem (kavita) for kids?",
        a: "A good Hindi poem for kids is short, uses simple rhyming words and is about things children know, like animals, food, family or the weather. In Hindi, a poem is called कविता (kavita), and children often learn one by heart for school. Kuchu Puchu has a Hindi Poems (Kavita) topic for short Hindi poems made for kids aged 3 to 8."
      },
      {
        q: "How are poems different from nursery rhymes?",
        a: "Nursery rhymes are usually sung to a tune, while poems are mostly spoken, or recited, with a steady rhythm. Reciting asks kids to remember the words, speak clearly and use expression in their voice. Both are good for language, and many children enjoy singing rhymes and saying poems."
      },
      {
        q: "How can I help my child prepare for a poem recitation?",
        a: "Choose a short poem your child likes and learn it a line or two at a time over a few days. Practice standing in front of family, speaking slowly and clearly, and adding a few simple actions. The Poem Recitation topic on Kuchu Puchu is for videos of poems said aloud, so kids can hear how a poem is recited."
      },
      {
        q: "Are there English poems for kids on Kuchu Puchu?",
        a: "Yes. English Poems is one of the topics in Kuchu Puchu Poems, for short, simple poems in English made for children aged 3 to 8. A grown-up can choose which languages to show, so your child can enjoy English poems alongside videos in Hindi, Punjabi or other languages your family speaks."
      },
      {
        q: "At what age can kids start learning poems?",
        a: "Even 3-year-olds can enjoy short poems by listening and joining in with the rhyming words. Older kids, around 5 to 8, can often learn a whole short poem by heart and recite it on their own. Kuchu Puchu poems are made for this whole age range, so younger and older kids can enjoy them together."
      }
    ],
    related: [
      "rhymes-songs",
      "school-classroom",
      "stories",
      "learn-languages"
    ]
  },
  {
    dbSlug: "maths",
    h1: "Kuchu Puchu Maths for Kids: Counting, Numbers & Tables",
    intro: "Kuchu Puchu Maths makes maths for kids simple and playful, with short videos about counting, numbers 1 to 10, tables (pahade), adding and taking away, big and small, and coins and telling time. Maths can come as a funny classroom cartoon, a count-along with cute animals or a table said aloud in a steady rhythm. The videos are made for children aged 3 to 8, have no ads and are reviewed by the Kuchu Puchu team before they go live.",
    videosHeading: "Watch Kuchu Puchu Maths Videos",
    topicsHeading: "Maths Topics for Little Learners",
    topicsText: "Choose a topic to practice one maths skill at a time, starting with what your child already knows. Topics include Counting & Numbers, Tables (Pahade), Adding & Taking Away, Big & Small, and Coins & Telling Time.",
    learnHeading: "What Kids Learn from Kuchu Puchu Maths Videos",
    learn: [
      {
        title: "Counting One by One",
        text: "Counting videos help kids say numbers in order, touch each object once and see that the last number they say tells how many."
      },
      {
        title: "Numbers 1 to 10",
        text: "Kids learn to recognize the numbers 1 to 10, say their names and match each number to the right amount of things."
      },
      {
        title: "Tables by Heart",
        text: "Tables, or pahade, like the 2 ka table, have a steady rhythm that makes them easier to say aloud and remember."
      },
      {
        title: "Adding and Taking Away",
        text: "With fingers, toys or fruit, kids see that adding makes a group bigger and taking away makes it smaller, a first step towards sums."
      },
      {
        title: "Comparing, Coins and Time",
        text: "Kids compare big and small, more and less, and get first ideas about coins, notes and the hours on a clock."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Maths Videos in the App",
    ctaText: "Count along with Kuchu Puchu maths videos in the free app, then keep counting with toys, spoons and stairs at home.",
    tipsHeading: "How to Make Maths Fun at Home",
    tips: [
      {
        title: "Count Everything",
        text: "Count stairs as you climb, rotis on a plate or cars on the road. Everyday counting shows kids that numbers are all around them, not only in books."
      },
      {
        title: "Say Tables Like a Chant",
        text: "Say a table together in a rhythm, on the way to school or at bath time. Start with the 2 ka table, and add a new one only when the first feels easy."
      },
      {
        title: "Play Shop",
        text: "Set up a pretend shop with toys and play money. Kids can count items, add up simple prices and hand over coins, a fun way to practice adding and money."
      }
    ],
    faqs: [
      {
        q: "How do I teach my child numbers 1 to 10?",
        a: "Start with numbers 1 to 5, then go up to 10 once your child feels confident. Count real things together, like toys or steps, and point to each one as you say the number. Show the written number too, so your child links the word, the amount and the symbol. Short Kuchu Puchu counting videos are a fun way to practice in between."
      },
      {
        q: "How can kids learn tables easily?",
        a: "Start with easy tables like the 2 ka table, and say them aloud in a rhythm, like a chant. Practice a little every day rather than all at once, and use real things, like pairs of shoes, to show what the table means. The Tables (Pahade) topic on Kuchu Puchu is for short videos that help kids say and remember tables."
      },
      {
        q: "What is 2 ka table?",
        a: "\"2 ka table\" means the table of 2: 2 × 1 = 2, 2 × 2 = 4, 2 × 3 = 6, and so on up to 2 × 10 = 20. It is often the first table children learn, because it is the same as counting in twos. In Hindi, tables are called pahade (पहाड़े)."
      },
      {
        q: "Is maths for kids only about numbers?",
        a: "No. Maths for young kids also means comparing big and small, spotting more and less, sorting things into groups, and first ideas about money and time. Kuchu Puchu has Big & Small and Coins & Telling Time topics, so kids can explore maths ideas beyond counting."
      },
      {
        q: "Can my child watch maths videos in Hindi or Punjabi?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more, and a grown-up can choose which languages to show. The maths videos your child sees depend on the languages you pick. You can also count and say tables in your home language as you watch."
      }
    ],
    related: [
      "early-learning",
      "school-classroom",
      "alphabets",
      "toys-play"
    ]
  },
  {
    dbSlug: "alphabets",
    h1: "Kuchu Puchu Alphabet for Kids: ABC, Varnamala & Gurmukhi",
    intro: "Kuchu Puchu Alphabets brings the alphabet for kids in more than one language, with topics for ABC and phonics, the Hindi varnamala, Punjabi Gurmukhi and the Urdu alphabet. Alphabet videos help kids see a letter, hear its sound and link it to a word, like A for apple in English or a se anar in Hindi. The videos are short and made for children aged 3 to 8, with no ads, and every one is reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Alphabet Videos",
    topicsHeading: "Alphabet Topics for Little Learners",
    topicsText: "Choose a topic to practice letters in the language your child is learning, or try two alphabets side by side. Topics include ABC & Phonics, Hindi Varnamala, Punjabi Gurmukhi, Urdu Alphabet and Writing Letters.",
    learnHeading: "What Kids Learn from Kuchu Puchu Alphabet Videos",
    learn: [
      {
        title: "Knowing Each Letter",
        text: "Kids learn to recognize letters by their shape, say their names and spot them again in books, on signboards and on food packets."
      },
      {
        title: "Letter Sounds and Phonics",
        text: "Phonics links each letter to the sound it makes, so kids can start blending sounds together to read simple words like cat and sun."
      },
      {
        title: "A Word for Every Letter",
        text: "Pairing each letter with a picture word, like A for apple or a se anar, helps kids remember the letter and learn a new word at the same time."
      },
      {
        title: "Different Scripts",
        text: "Kids discover that Hindi, Punjabi and Urdu each have their own letters and shapes, and that Urdu is written from right to left."
      },
      {
        title: "First Steps in Writing",
        text: "The Writing Letters topic is about forming each letter with simple strokes, which helps small hands get ready to write."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Alphabet Videos in the App",
    ctaText: "Practice letters with Kuchu Puchu alphabet videos in the free app, where a grown-up can choose which languages to show.",
    tipsHeading: "How to Practice the Alphabet at Home",
    tips: [
      {
        title: "Go on a Letter Hunt",
        text: "Pick one letter a day and look for it together on food packets, signboards, books and number plates. Finding letters in real life helps them stick."
      },
      {
        title: "Trace Before Writing",
        text: "Let your child trace a letter in sand or flour, or with a finger on your palm, before picking up a pencil. Big, playful movements come first, and neat writing comes later."
      },
      {
        title: "Say the Sound and a Word",
        text: "When you point to a letter, say its sound as well as its name, then think of a word together, like b for ball. In Hindi, try ka se kabootar."
      }
    ],
    faqs: [
      {
        q: "What is the best way to teach ABC to kids?",
        a: "Start with the letters in your child's name, then add a few new letters each week. Sing an ABC song, point out letters around you and say each letter's sound as well as its name. Kuchu Puchu has an ABC & Phonics topic for short videos that link letters to words, so practice feels like play."
      },
      {
        q: "What is Hindi varnamala?",
        a: "Varnamala (वर्णमाला) is the Hindi alphabet, written in the Devanagari script. It has vowels, called swar, and consonants, called vyanjan. Children often learn it with picture words, like a se anar (pomegranate) and ka se kabootar (pigeon). Kuchu Puchu has a Hindi Varnamala topic for short alphabet videos in Hindi."
      },
      {
        q: "How can kids learn the Punjabi alphabet (Gurmukhi)?",
        a: "The Punjabi alphabet is written in the Gurmukhi script, and children usually learn the letters in order, starting with ura, aira and iri. Say each letter aloud together, trace its shape and practice a few letters at a time. Kuchu Puchu has a Punjabi Gurmukhi topic for short videos that help kids see and say the letters."
      },
      {
        q: "At what age should a child learn the alphabet?",
        a: "Many children start noticing letters around age 3, often beginning with the letters in their own name, and learn more of them between 4 and 6. Every child goes at their own pace, so there is no need to rush. Short, playful practice, like songs, letter hunts and alphabet videos, is usually more fun for young kids than long lessons."
      },
      {
        q: "Can my child learn English and Hindi letters at the same time?",
        a: "Yes. Many children learn two alphabets side by side, especially when more than one language is used at home or at school. Keep each language clear by saying the letter and a picture word in that language. On Kuchu Puchu, a grown-up can choose which languages to show, so your child sees videos in the languages your family uses."
      }
    ],
    related: [
      "early-learning",
      "words-names",
      "learn-languages",
      "rhymes-songs"
    ]
  },
  {
    dbSlug: "words-names",
    h1: "Kuchu Puchu Vocabulary for Kids: Names of Things in English & Hindi",
    intro: "Kuchu Puchu Words & Names is the place for vocabulary for kids, with short videos about the names of things around us, action words and simple sentences. Kids can see an everyday thing, hear its name and say it back, and there is a topic for names of things in English and Hindi side by side. The videos are made for children aged 3 to 8, have no ads and are reviewed by the Kuchu Puchu team before they go live.",
    videosHeading: "Watch Kuchu Puchu Vocabulary Videos",
    topicsHeading: "Word Topics for Little Learners",
    topicsText: "Choose a topic to grow your child's words step by step, from naming the things they see to saying a whole sentence. Topics include Things Around Us, Action Words, Simple Sentences, and Names in Hindi & English.",
    learnHeading: "What Kids Learn from Kuchu Puchu Vocabulary Videos",
    learn: [
      {
        title: "Names of Everyday Things",
        text: "Kids learn the names of things they see every day, like things at home, food, toys, sports items, birds and insects."
      },
      {
        title: "Action Words",
        text: "Words like run, jump, eat and sleep help kids say what is happening, not only what things are called."
      },
      {
        title: "Simple Sentences",
        text: "Kids move from single words to short sentences, like \"This is a ball\" or \"I am eating\", a big step towards speaking clearly."
      },
      {
        title: "Two Languages Side by Side",
        text: "Hearing a thing's name in English and Hindi together, like spoon and chammach, helps kids link both words to the same thing."
      },
      {
        title: "Words in Groups",
        text: "Kids learn that words belong to groups, like food, birds or things in the kitchen, which makes new words easier to remember and find."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Vocabulary Videos in the App",
    ctaText: "Learn new words with Kuchu Puchu vocabulary videos in the free app, then go round your home naming things together.",
    tipsHeading: "How to Build Vocabulary at Home",
    tips: [
      {
        title: "Name Things All Day",
        text: "Talk about what you are doing and point as you go: \"Here is your cup. Now let's wash the plate.\" Hearing words again and again in real moments helps them stick."
      },
      {
        title: "Play I Spy",
        text: "Say \"I spy something red\" or \"I spy something we eat\" and let your child guess. Then swap, so your child has to find the words to describe things."
      },
      {
        title: "Grow Short Answers",
        text: "When your child says one word, like \"ball\", gently add to it: \"Yes, a big red ball.\" This shows how to build longer sentences without correcting them."
      }
    ],
    faqs: [
      {
        q: "How can I improve my child's vocabulary?",
        a: "Talk with your child often, name the things you see together and read picture books every day. Ask open questions, like \"What is he doing?\", and add a word or two to your child's answers. Short Kuchu Puchu vocabulary videos can add fun practice, especially when you say the words aloud together."
      },
      {
        q: "Which things names should kids learn first?",
        a: "Start with things your child sees and uses every day: family members, body parts, food, toys, clothes, and things at home like cup, plate, bed and door. Then add animals, birds, vehicles and things outside. The Things Around Us topic on Kuchu Puchu is for short videos that show and name everyday things."
      },
      {
        q: "How do I teach my child the names of things in English and Hindi?",
        a: "Point to a real thing and say both names, like \"This is a spoon, chammach (चम्मच).\" Pick a few words a day from one place, such as the kitchen, and use them often. Kuchu Puchu has a Names in Hindi & English topic for short videos that show both names side by side."
      },
      {
        q: "What are some simple English sentences for kids?",
        a: "Simple English sentences for kids are short and about everyday life, like \"This is my bag\", \"I am happy\", \"The cat is sleeping\" and \"Can I have water, please?\" Practice them during daily routines so they feel natural. The Simple Sentences topic on Kuchu Puchu is for short videos that help kids move from single words to whole sentences."
      },
      {
        q: "What are action words for kids?",
        a: "Action words, or verbs, tell us what someone is doing, like run, jump, eat, sleep, read and clap. Young kids enjoy learning them by doing the action while saying the word, so try a game of \"Can you jump? Can you clap?\" Kuchu Puchu has an Action Words topic for short videos about everyday actions."
      }
    ],
    related: [
      "alphabets",
      "learn-languages",
      "early-learning",
      "school-classroom"
    ]
  },
  {
    dbSlug: "body-routine",
    h1: "Kuchu Puchu Body Parts & Daily Routine Videos for Kids",
    intro: "Kuchu Puchu My Body & Daily Routine videos are short clips about body parts for kids and the small jobs of every day, like brushing teeth, bath time and going to bed. Children aged 3 to 8 learn body parts names, the five senses and a simple daily routine, one good habit at a time. Every video is free, has no ads and is reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Body & Routine Videos",
    topicsHeading: "Body and Routine Topics for Little Ones",
    topicsText: "Pick a topic to learn about the body or one part of the day at a time. Topics include body parts, daily routine, brushing and bath time, the five senses, and sleep and rest.",
    learnHeading: "What Kids Learn from Kuchu Puchu Body & Routine Videos",
    learn: [
      {
        title: "Body Part Names",
        text: "Kids learn to name and point to their head, eyes, nose, ears, mouth, hands, knees and toes, and to say these names in the languages they hear at home."
      },
      {
        title: "The Five Senses",
        text: "Kids learn that we see with our eyes, hear with our ears, smell with our nose, taste with our tongue and feel with our skin."
      },
      {
        title: "The Order of the Day",
        text: "A daily routine has steps: wake up, brush, wash, eat, play and get ready for bed. Knowing what comes next helps kids feel calm and ready."
      },
      {
        title: "Brushing and Bath Time",
        text: "Kids learn why we brush our teeth in the morning and at night, wash our hands before meals and take a bath to keep our bodies clean."
      },
      {
        title: "Why Rest Matters",
        text: "Kids learn that sleep and quiet rest give their bodies a break, so they wake up fresh and ready to play and learn again."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Body & Routine Videos in the App",
    ctaText: "Learn body parts and daily routines with short videos in the free Kuchu Puchu app, with no account needed for kids.",
    tipsHeading: "How to Build a Happy Daily Routine at Home",
    tips: [
      {
        title: "Play a Pointing Game",
        text: "Say \"Touch your nose!\" or \"Show me your knees!\" and let your child point. Then swap, so your child gives the orders. Say the names in your home language too."
      },
      {
        title: "Make a Picture Routine Chart",
        text: "Draw or stick pictures for waking up, brushing, bath, meals and bedtime. Your child can point to each step as it is done and feel proud at the end of the day."
      },
      {
        title: "Keep Bedtime Calm",
        text: "Switch off screens a while before bed. A bath, brushing teeth, a short story and a soft song in the same order each night help little ones settle down."
      }
    ],
    faqs: [
      {
        q: "How do I teach my child body parts names?",
        a: "Start with the parts kids can see and touch: head, eyes, nose, ears, mouth, hands and feet. Point to each one, say its name and ask your child to copy you. Games like \"touch your nose\" make it fun. The Body Parts topic on Kuchu Puchu is for short videos that add more practice."
      },
      {
        q: "What are body parts names in Hindi?",
        a: "Some first body parts names in Hindi are sir (head), aankh (eye), naak (nose), kaan (ear), munh (mouth), haath (hand) and pair (foot). Say the Hindi and English names together as you point to each part. Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more, and a grown-up can choose which languages to show."
      },
      {
        q: "What is a good daily routine for kids?",
        a: "A good daily routine for kids follows the same simple steps each day: wake up, use the toilet, brush teeth, wash, eat breakfast, play and learn, have meals, take a bath and go to bed at a regular time. Pictures or a short song can help little ones remember the order. The Daily Routine topic on Kuchu Puchu is for short videos about these everyday steps."
      },
      {
        q: "What are the five senses for kids?",
        a: "The five senses are sight, hearing, smell, taste and touch. We see with our eyes, hear with our ears, smell with our nose, taste with our tongue and feel with our skin. Try a senses game at home: smell a lemon, touch something soft and listen with your eyes closed. The Five Senses topic on Kuchu Puchu is for short videos about this."
      },
      {
        q: "How do I make brushing teeth a daily habit for my child?",
        a: "Brush at the same times every day, in the morning and before bed, and brush your own teeth next to your child so they can copy you. Use a small, soft toothbrush and help young children until they can brush well on their own. The Brushing & Bath Time topic on Kuchu Puchu is for short videos about good habits like these."
      }
    ],
    related: [
      "good-habits",
      "science-nature",
      "dance-movement",
      "words-names"
    ]
  },
  {
    dbSlug: "fruits-vegetables",
    h1: "Kuchu Puchu Fruits & Vegetables Names for Kids",
    intro: "Kuchu Puchu Fruits & Vegetables videos help kids learn fruits names and vegetables names, from mango and banana to potato, tomato and carrot. They are short videos for children aged 3 to 8, with topics for fruits, vegetables, food names and food rhymes. Kuchu Puchu has videos in Hindi, English, Punjabi and more, so kids can learn fal aur sabziyan in the languages your family speaks. Every video is free, has no ads and is reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Fruits & Vegetables Videos",
    topicsHeading: "Fruit and Vegetable Topics Kids Love",
    topicsText: "Pick a topic to learn about one kind of food at a time. Topics include fruits, vegetables, food names and food rhymes, so kids can learn the names, colors and songs of the food on their plate.",
    learnHeading: "What Kids Learn from Kuchu Puchu Fruits & Vegetables Videos",
    learn: [
      {
        title: "Fruit and Vegetable Names",
        text: "Kids learn the names of fruits and vegetables they see at home and at the market, like apple, banana, mango, potato, onion and carrot."
      },
      {
        title: "Colors, Shapes and Sizes",
        text: "A red tomato, a yellow banana, a long green bhindi and a round orange. Kids learn to describe and compare foods by color, shape and size."
      },
      {
        title: "Food Names at Mealtime",
        text: "Kids learn the names of everyday foods like roti, chawal, dal and sabzi, and to say thank you, or dhanyavad, after a meal."
      },
      {
        title: "Singing About Food",
        text: "Food rhymes repeat food names in a fun tune, so kids remember them easily and love to sing them again at the table."
      },
      {
        title: "Healthy Eating Habits",
        text: "Kids learn that eating different fruits and vegetables helps their bodies stay strong, and that it is okay to try a small bite of something new."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Fruits & Vegetables Videos in the App",
    ctaText: "Learn fruits and vegetables names with short videos in the free Kuchu Puchu app, then find them together in your kitchen.",
    tipsHeading: "How to Enjoy Fruits and Vegetables at Home",
    tips: [
      {
        title: "Name Foods at the Market",
        text: "When you shop for fruits and vegetables, let your child point and name each one. Ask about colors, and count tomatoes or bananas into the bag together."
      },
      {
        title: "Let Kids Wash and Sort",
        text: "Let your child wash fruits and vegetables and sort them by color or size. Keep knives a grown-up job, and praise every bit of help."
      },
      {
        title: "Make a Rainbow Plate",
        text: "Put a few colorful fruits or vegetables on a plate and name each color together. Offer a small taste of something new, with no pressure to finish it."
      }
    ],
    faqs: [
      {
        q: "What are some easy fruits names for kids?",
        a: "Easy first fruits names for kids are apple, banana, mango, orange, grapes, papaya, watermelon and guava. Start with fruits your child eats at home, then add new ones from the market. Name the color and shape of each fruit as you go. The Fruits topic on Kuchu Puchu is for short videos about fruit names."
      },
      {
        q: "What are some vegetables names for kids?",
        a: "Good first vegetables names for kids are potato, tomato, onion, carrot, peas, cauliflower, cabbage, spinach and okra, also called bhindi. Start with vegetables cooked at home, and let your child touch, smell and name them in the kitchen. The Vegetables topic on Kuchu Puchu is for short videos about vegetable names."
      },
      {
        q: "What are fruits and vegetables called in Hindi?",
        a: "In Hindi, fruits are called fal and vegetables are called sabzi, so fruits and vegetables together are fal aur sabziyan. Some fruits in Hindi are seb (apple), kela (banana), aam (mango), santra (orange) and angoor (grapes). Some vegetables are aloo (potato), tamatar (tomato), pyaaz (onion), gajar (carrot) and matar (peas). On Kuchu Puchu, a grown-up can choose which languages to show, including Hindi."
      },
      {
        q: "How can I get my child to eat more fruits and vegetables?",
        a: "Offer small pieces next to foods your child already likes, and eat fruits and vegetables together as a family. Let your child help choose, wash and sort them. Stay relaxed if they say no, and try again another day. Fun songs and rhymes about food can also make new foods feel friendly."
      },
      {
        q: "What are food rhymes for kids?",
        a: "Food rhymes are short, silly songs about fruits, vegetables and meals. The repeating words and simple tunes help kids remember food names and sing along. The Food Rhymes topic on Kuchu Puchu is for short sing-along rhymes like these, made for children aged 3 to 8."
      }
    ],
    related: [
      "kids-cooking",
      "good-habits",
      "words-names",
      "rhymes-songs"
    ]
  },
  {
    dbSlug: "family-friends",
    h1: "Kuchu Puchu Family & Friends Videos for Kids",
    intro: "Kuchu Puchu Family & Friends videos are short, warm clips about the people kids love most: maa and papa, dadi and dadu, nani and nanu, brothers, sisters and friends. They help children aged 3 to 8 learn the names of family members, show love and respect to elders, and be a kind friend. Every video is free, has no ads and is reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Family & Friends Videos",
    topicsHeading: "Family and Friends Topics for Little Ones",
    topicsText: "Choose a topic to celebrate the special people in your child's life. Topics include maa and papa, grandparents, brothers and sisters, and friendship.",
    learnHeading: "What Kids Learn from Kuchu Puchu Family & Friends Videos",
    learn: [
      {
        title: "Family Member Names",
        text: "Kids learn what to call each person in the family, like maa, papa, dadi, dadu, nani, nanu, bhaiya and didi, and how everyone is related."
      },
      {
        title: "Love and Thank You",
        text: "Poems and songs about maa and papa help kids notice the many ways parents care for them, and say thank you and I love you."
      },
      {
        title: "Respect for Elders",
        text: "Kids learn kind ways to greet grandparents and elders, like saying namaste, listening when they speak and helping them when they can."
      },
      {
        title: "Sharing with Brothers and Sisters",
        text: "Kids learn to share, take turns, say sorry after a quarrel and make up again with their brothers, sisters and cousins."
      },
      {
        title: "Being a Good Friend",
        text: "Kids learn to play together, include others, share toys and help a friend who feels sad or left out."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Family & Friends Videos in the App",
    ctaText: "Watch family and friendship videos in the free Kuchu Puchu app, then call a grandparent or invite a friend over to play.",
    tipsHeading: "How to Celebrate Family and Friends at Home",
    tips: [
      {
        title: "Make a Family Tree",
        text: "Draw a simple family tree with photos or drawings. Say each person's name and what your child calls them, like dadi, nani or chacha."
      },
      {
        title: "Stay Close to Grandparents",
        text: "Call or visit grandparents and let your child greet them, sing a rhyme or show a drawing. Small, regular moments help kids feel close to their elders."
      },
      {
        title: "Plan a Play Date",
        text: "Invite a friend over for simple games. Before they arrive, talk about sharing toys and taking turns, and afterwards praise the kind moments you saw."
      }
    ],
    faqs: [
      {
        q: "How do I teach my child the names of family members?",
        a: "Start with the people your child sees every day, like maa, papa, brothers and sisters, then add grandparents, aunts, uncles and cousins. Use family photos to point and name each person, using the words your family uses, like dadi, dadu, nani or nanu. Kuchu Puchu Family & Friends is for short videos about family members for kids."
      },
      {
        q: "What do dadi, dadu, nani and nanu mean?",
        a: "In many Hindi-speaking families, dadi and dadu (or dada) are papa's mother and father, and nani and nanu (or nana) are maa's mother and father. Some families use other words for grandparents, and every one of them is special. The Grandparents topic on Kuchu Puchu is for short videos about loving and respecting grandparents."
      },
      {
        q: "What is a good maa poem for kids?",
        a: "A good maa poem for kids is short and simple, with lines a child can repeat, about how maa loves and cares for the family. Kids can say it on Mother's Day, on maa's birthday or just to make her smile. The Maa & Papa topic on Kuchu Puchu is for short poems and songs about a parent's love."
      },
      {
        q: "What are family songs for kids?",
        a: "Family songs for kids are simple songs about maa, papa, grandparents, brothers and sisters, often with a happy tune and repeating lines. Singing them together helps kids learn family words and feel loved. You can also make your own family song by adding family names to a favorite rhyme."
      },
      {
        q: "How can I teach my child about friendship?",
        a: "Talk about what good friends do: share, take turns, listen and help when someone is sad. Practice during play dates, and praise kind moments when you see them. Stories and short videos can help kids picture what a good friend looks like. The Friendship topic on Kuchu Puchu is for short videos about being a kind friend."
      }
    ],
    related: [
      "poems",
      "good-habits",
      "stories",
      "rhymes-songs"
    ]
  },
  {
    dbSlug: "music-instruments",
    h1: "Kuchu Puchu Music & Musical Instruments for Kids",
    intro: "Kuchu Puchu Music & Instruments videos introduce musical instruments for kids, from the drum, guitar and flute to Indian instruments like the dhol, tabla and harmonium. Children aged 3 to 8 learn musical instruments names, hear how each one sounds and clap along to simple rhythms and beats. Every video is free, has no ads and is reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Music Videos",
    topicsHeading: "Music Topics Kids Love",
    topicsText: "Pick a topic to explore music one step at a time, from naming instruments to keeping a beat. Topics include Musical Instruments, Indian Instruments, Rhythm & Beats and Learn Music.",
    learnHeading: "What Kids Learn from Kuchu Puchu Music Videos",
    learn: [
      {
        title: "Instrument Names",
        text: "Kids learn the names of musical instruments like the drum, piano, guitar, flute, violin and xylophone, and match each name to a picture."
      },
      {
        title: "Listening to Sounds",
        text: "Each instrument has its own sound: a drum booms, a flute sings softly and bells jingle. Kids start to guess an instrument just by listening."
      },
      {
        title: "Indian Instruments",
        text: "Kids meet instruments they may hear at weddings, festivals and folk songs, like the dhol, tabla, bansuri, harmonium, tumbi, algoza and chimta."
      },
      {
        title: "Rhythm and Beat",
        text: "Clapping, tapping and drumming along helps kids feel a steady beat and try playing fast and slow, loud and soft."
      },
      {
        title: "How Instruments Make Sound",
        text: "Kids learn that some instruments are hit, some are blown, some have strings to pluck and some have keys to press."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Music Videos in the App",
    ctaText: "Listen, clap and learn instrument names with Kuchu Puchu music videos in the free app, with no ads to stop the music.",
    tipsHeading: "How to Enjoy Music with Kids at Home",
    tips: [
      {
        title: "Make Home Instruments",
        text: "A steel bowl and a wooden spoon make a drum, and a closed bottle with dry rice makes a shaker. Close lids tightly and keep small bits away from little ones."
      },
      {
        title: "Clap the Beat Together",
        text: "Clap along to a favorite song, then try it fast and slow, loud and soft. Take turns making a clapping pattern for the other person to copy."
      },
      {
        title: "Spot Instruments Around You",
        text: "At a wedding, a festival or a family function, listen for the music together. Point out the instruments and ask your child to name them or copy their sound."
      }
    ],
    faqs: [
      {
        q: "What are some musical instruments names for kids?",
        a: "Easy first musical instruments names for kids are drum, piano, guitar, flute, violin, trumpet, xylophone and bells. Indian instruments kids often hear include the dhol, tabla, harmonium and bansuri. Show a picture, make the sound together and ask your child to name it. The Musical Instruments topic on Kuchu Puchu is for short videos about instrument names and sounds."
      },
      {
        q: "What are some Indian musical instruments for kids?",
        a: "Indian musical instruments for kids to know include the tabla, dhol, harmonium, sitar, bansuri, shehnai and veena. Punjabi folk music also uses the tumbi, algoza and chimta. Many children hear these at weddings, festivals and family celebrations. The Indian Instruments topic on Kuchu Puchu is for short videos that introduce them."
      },
      {
        q: "What is the difference between a dhol and a tabla?",
        a: "A dhol is a big, barrel-shaped drum with two sides, usually hung from the shoulder and played with two sticks. It is loud and often played at weddings and bhangra dances. A tabla is a pair of small drums played with the fingers and palms while sitting down. Both are Indian drums, but they look and sound very different."
      },
      {
        q: "How can I teach my child rhythm?",
        a: "Start by clapping along to a simple song, then tap your knees, stamp your feet or gently beat a pot with a spoon. Play fast and slow, loud and soft, and let your child copy you. A little music play every day works better than one long lesson. The Rhythm & Beats topic on Kuchu Puchu is for short videos made for clapping along."
      },
      {
        q: "When can kids start learning music?",
        a: "Kids can enjoy music at any age by singing, clapping and playing simple drums or shakers. When to start lessons on an instrument depends on the child and the instrument, so watch for interest and keep it fun. The Learn Music topic on Kuchu Puchu is for short, simple first music lessons for children aged 3 to 8."
      }
    ],
    related: [
      "rhymes-songs",
      "dance-movement",
      "our-world",
      "early-learning"
    ]
  },
  {
    dbSlug: "vehicles",
    h1: "Kuchu Puchu Vehicles & Transport for Kids",
    intro: "Kuchu Puchu Vehicles & Transport is all about vehicles for kids: cars and buses, trains, planes and boats, the JCB (digger) and other big machines, fire trucks and ambulances. It is made for children aged 3 to 8 who love to learn vehicle names, copy vehicle sounds and find out what each machine does. New vehicle videos are on the way, and each one will be reviewed by the Kuchu Puchu team before it goes live.",
    videosHeading: "Watch Kuchu Puchu Vehicle Videos",
    topicsHeading: "Vehicle Topics Kids Love",
    topicsText: "Each topic is for one kind of vehicle, so kids can explore the ones they like most. Topics include cars and buses, trains, planes and boats, the JCB (digger) and other diggers, and fire trucks and ambulances. New vehicle videos are on the way, and creators can apply at mykuchupuchu.com/register to make original vehicle videos for kids.",
    learnHeading: "What Kids Learn About Vehicles",
    learn: [
      {
        title: "Vehicle Names",
        text: "Kids learn to name the vehicles they see every day, like a car, bus, auto rickshaw, scooter, truck, train and plane."
      },
      {
        title: "Vehicle Sounds",
        text: "Beep beep, choo choo, vroom and the siren of a fire truck. Kids love to copy vehicle sounds and match each sound to the right vehicle."
      },
      {
        title: "Land, Water and Air",
        text: "Kids learn to sort vehicles by where they go: cars and trains on land, boats and ships on water, and planes and helicopters in the sky."
      },
      {
        title: "Machines That Build",
        text: "Kids find out what big machines do on a building site: a JCB (digger) digs, a crane lifts and a dumper truck carries soil and stones."
      },
      {
        title: "Helper Vehicles",
        text: "Kids learn that fire trucks and ambulances rush to help people, and that cars and people make way when they hear a siren."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu Vehicle Videos in the App",
    ctaText: "Get the free Kuchu Puchu app to watch new vehicle videos as they arrive, with no ads and no account needed for kids.",
    tipsHeading: "How to Enjoy Vehicles with Kids at Home",
    tips: [
      {
        title: "Play Vehicle Spotting",
        text: "On walks or rides, look for buses, bikes, autos and trucks. Name each vehicle, say its color and guess where it might be going."
      },
      {
        title: "Build a Pretend Train",
        text: "Line up a few boxes or chairs to make a train or a bus. Take turns being the driver and the passengers, and make the sounds together."
      },
      {
        title: "Talk About Road Safety",
        text: "Hold hands near roads, wait for a grown-up before crossing and buckle up in the car. Talk about these rules every time you go out, so they become habits."
      }
    ],
    faqs: [
      {
        q: "How can I teach my child vehicle names?",
        a: "Start with vehicles your child sees every day, like a car, bus, bike, auto rickshaw, truck and train. Point and name them on walks and rides, make their sounds together, and use toy vehicles or picture books at home. Kuchu Puchu Vehicles & Transport is for short videos about vehicle names for kids, and new vehicle videos are on the way."
      },
      {
        q: "Why do kids love train and JCB (digger) videos?",
        a: "Trains and diggers are big, loud and busy, and kids can see exactly what they do, from pulling carriages to digging soil. Watching them helps kids learn new words and ask how things work. Kuchu Puchu has topics for trains and for diggers, meant for short, gentle videos like these, and new vehicle videos are on the way."
      },
      {
        q: "What will kids find in Kuchu Puchu vehicle videos?",
        a: "Kuchu Puchu Vehicles & Transport is for short car cartoons, train videos and simple clips about planes, boats, diggers, fire trucks and ambulances. New vehicle videos are on the way. Like every Kuchu Puchu video, they will be short, made for children aged 3 to 8 and free to watch, with no ads."
      },
      {
        q: "How do I teach my child road safety?",
        a: "Keep road safety simple and repeat it often: hold a grown-up's hand near roads, stop at the edge, look both ways and cross only when a grown-up says it is safe. In a car, always use a seat belt or a child seat. Practice the rules on every outing, and praise your child when they remember."
      },
      {
        q: "Can creators make vehicle videos for Kuchu Puchu?",
        a: "Yes. Kuchu Puchu welcomes original vehicle videos made for children aged 3 to 8. Creators can apply at mykuchupuchu.com/register, and approved creators can upload videos. Every video is reviewed by the Kuchu Puchu team before it goes live and must follow clear rules, such as no violence, no scary content, no ads and no product promotion."
      }
    ],
    related: [
      "our-world",
      "cartoons-animation",
      "toys-play",
      "early-learning"
    ]
  },
  {
    dbSlug: "lang-hi",
    h1: "Kuchu Puchu Hindi Videos for Kids: Cartoons, Poems & More",
    intro: "Kuchu Puchu in Hindi (हिन्दी) brings short Hindi videos for kids aged 3 to 8, from funny Hindi cartoons and poems to first words, counting and good manners. It is a warm way for children to hear Hindi every day, whether it is their home language or a new one. Every video comes from an approved creator and is reviewed by the Kuchu Puchu team before it goes live, with no ads. A grown-up can choose which languages to show, so your child can watch in Hindi alone or in Hindi and English together.",
    videosHeading: "Watch Kuchu Puchu Videos in Hindi",
    topicsHeading: "Browse Hindi Videos by Topic",
    topicsText: "Hindi videos on Kuchu Puchu cover cartoons, poems, good values, muhavare, first words and early learning. Kids can watch jungle school cartoons with animal teachers, listen to short Hindi poems about family, animals and food, and learn words for food, body parts, things at home, birds and insects. There are also videos on ABC words, daily routine, counting 1 to 10, colors with fruits and greeting elders.",
    learnHeading: "Why Kids Enjoy Kuchu Puchu in Hindi",
    learn: [
      {
        title: "Hindi Cartoons with a Lesson",
        text: "In jungle school cartoons, a lion, a monkey or a crocodile is the teacher. Kids laugh at the animal class and pick up simple lessons along the way."
      },
      {
        title: "Hindi Poems to Say Along",
        text: "Short Hindi poems about Maa, animals and food have easy rhymes and a steady beat, so kids can learn the lines and say them out loud."
      },
      {
        title: "Muhavare and Good Values",
        text: "Classroom-style videos explain Hindi muhavare (idioms) and good values in simple words. They give families an easy way to talk about right and wrong."
      },
      {
        title: "First Hindi Words",
        text: "Kids hear Hindi names for food, body parts, things at home, birds and insects, then spot those things around the house and say them in Hindi."
      },
      {
        title: "Counting, Colors and Respect",
        text: "Kids count from 1 to 10, learn colors with the help of fruits, and see how to greet elders with a Namaste to Dadi and Dadu."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu in Hindi in the App",
    ctaText: "Get the free Kuchu Puchu app on Android or iPhone and choose Hindi behind the grown-ups check. Kids can start watching without an account.",
    tipsHeading: "Tips for Raising Kids with Hindi at Home",
    tips: [
      {
        title: "Speak Hindi in Everyday Moments",
        text: "Use Hindi at meals, bath time and bedtime. Young kids often pick up a home language most easily when they hear it every day from the people they love."
      },
      {
        title: "Two Languages Are Okay",
        text: "Many children grow up with Hindi and English together, and mixing words at first is common. Answer in Hindi, gently repeat the word, and keep it fun, never a test."
      },
      {
        title: "Bring Grandparents In",
        text: "Ask Dadi, Dada, Nani or Nana to share a poem, a muhavara or a kahani from their childhood. After a video, let your child say a new Hindi word to them."
      }
    ],
    faqs: [
      {
        q: "Is Kuchu Puchu available in Hindi?",
        a: "Yes. Kuchu Puchu has Hindi videos for kids aged 3 to 8, including cartoons, poems, good values and first words. You can watch them on this page, on the website or in the free app for Android and iPhone. A grown-up can choose Hindi as a language to show."
      },
      {
        q: "Which languages is Kuchu Puchu in?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more languages. A grown-up can choose one language or several, so your child sees videos in the languages your family speaks or wants to learn."
      },
      {
        q: "How do I show only Hindi videos?",
        a: "In the Kuchu Puchu app, open the settings behind the grown-ups check and choose Hindi as the language to show. On the website, pick Hindi in the language filter on the Explore page, or watch the videos on this page. You can add English or another language at any time."
      },
      {
        q: "Are there Hindi poems and kahani for kids on Kuchu Puchu?",
        a: "Yes. Kuchu Puchu has short Hindi poems (kavita) about family, animals and food, with easy lines kids can say along. For a little kahani with a lesson, try the Hindi jungle school cartoons and good values videos. Kuchu Puchu Stories is also the place for moral stories, bedtime stories and folk tales."
      },
      {
        q: "Is Kuchu Puchu free?",
        a: "Yes. Kuchu Puchu is free on the website and in the app for Android and iPhone. There is no subscription, no in-app purchases and no ads. Kids can watch Hindi videos without an account."
      }
    ],
    related: [
      "poems",
      "cartoons-animation",
      "words-names",
      "good-habits"
    ]
  },
  {
    dbSlug: "lang-pa",
    h1: "Kuchu Puchu Punjabi Videos for Kids: Alphabet, Poems & Cartoons",
    intro: "Kuchu Puchu in Punjabi (ਪੰਜਾਬੀ) brings short Punjabi videos for kids aged 3 to 8, from the Punjabi alphabet and counting to cartoons, poems and folk music. It is a simple way for children to learn Punjabi, or to keep hearing it if Punjabi is spoken at home. Every video comes from an approved creator and is reviewed by the Kuchu Puchu team before it goes live, with no ads. A grown-up can choose which languages to show, so your child can watch in Punjabi alone or alongside Hindi or English.",
    videosHeading: "Watch Kuchu Puchu Videos in Punjabi",
    topicsHeading: "Browse Punjabi Videos by Topic",
    topicsText: "Punjabi videos on Kuchu Puchu cover the alphabet, numbers, classroom learning, poems, music, heritage stories and cartoons. Kids can practice Gurmukhi letters, count from 1 to 10, learn the 2 times table and meet folk instruments like the dhol, tumbi, algoza and chimta. There are also jungle school and monkey school cartoons, and videos on body parts, things at home, sports items, ABC words and daily routine.",
    learnHeading: "Why Kids Enjoy Kuchu Puchu in Punjabi",
    learn: [
      {
        title: "The Punjabi Alphabet",
        text: "Alphabet videos go through the Gurmukhi letters one by one, so kids can see each letter, hear it spoken and say it back."
      },
      {
        title: "Numbers, Tables and Classroom Poems",
        text: "Kids count from 1 to 10, practice the 2 times table and hear poems recited in class. Classroom-style lessons make it easy to follow along and repeat."
      },
      {
        title: "Punjabi Folk Instruments",
        text: "Kids meet folk instruments like the dhol, tumbi, algoza and chimta and learn what each one is called. It is a lively first step into Punjabi music."
      },
      {
        title: "Heritage Stories",
        text: "Heritage stories from Sikh history, told in Punjabi, give families a way to share the past with their children and talk about courage and faith."
      },
      {
        title: "Punjabi Cartoons and Everyday Words",
        text: "Jungle school and monkey school cartoons keep things funny, while word videos teach Punjabi names for body parts, things at home and sports items."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu in Punjabi in the App",
    ctaText: "Get the free Kuchu Puchu app on Android or iPhone and choose Punjabi behind the grown-ups check. Kids can start watching without an account.",
    tipsHeading: "Tips for Raising Kids with Punjabi at Home",
    tips: [
      {
        title: "Speak Punjabi Every Day",
        text: "Use Punjabi at meals, while getting dressed and at bedtime, and ask grandparents to chat, sing and tell stories in Punjabi. Hearing it often from people they love helps young kids pick it up."
      },
      {
        title: "Learn Gurmukhi Little by Little",
        text: "Practice two or three letters a week. Write them big, trace them with a finger, and look for them in books and on signs. Small, happy steps are easier for young kids than long lessons."
      },
      {
        title: "Mixing Languages Is Okay",
        text: "Many kids grow up with Punjabi alongside English or Hindi, and mixing words at first is common. Answer in Punjabi, gently repeat the word, and praise every try."
      }
    ],
    faqs: [
      {
        q: "Is Kuchu Puchu available in Punjabi?",
        a: "Yes. Kuchu Puchu has Punjabi videos for kids aged 3 to 8, including the Punjabi alphabet, counting, poems, folk music, cartoons and first words. You can watch them on this page, on the website or in the free app for Android and iPhone. A grown-up can choose Punjabi as a language to show."
      },
      {
        q: "Can my child learn the Punjabi alphabet on Kuchu Puchu?",
        a: "Kuchu Puchu has Punjabi alphabet videos that go through the Gurmukhi letters, so kids can see and hear each one. They work best alongside practice at home, like tracing letters and spotting them in books. A few letters at a time, with a grown-up cheering along, keeps it fun."
      },
      {
        q: "Which languages is Kuchu Puchu in?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more languages. A grown-up can choose which ones to show, so your child can watch Punjabi on its own or mixed with the other languages your family uses."
      },
      {
        q: "How do I show only Punjabi videos?",
        a: "In the Kuchu Puchu app, open the settings behind the grown-ups check and choose Punjabi as the language to show. On the website, pick Punjabi in the language filter on the Explore page, or watch the videos on this page. You can add more languages whenever you like."
      },
      {
        q: "Is Kuchu Puchu free?",
        a: "Yes. Kuchu Puchu is free to watch on the website and in the app for Android and iPhone. There is no subscription, nothing to buy and no ads. Kids can watch Punjabi videos without an account."
      }
    ],
    related: [
      "alphabets",
      "music-instruments",
      "school-classroom",
      "learn-languages"
    ]
  },
  {
    dbSlug: "lang-en",
    h1: "Kuchu Puchu English Videos for Kids: Learning, Poems & Fun",
    intro: "Kuchu Puchu in English brings short English videos for kids aged 3 to 8, from colors, counting and food names to weather, art, outdoor games and funny animal cartoons. They are a gentle way for kids to learn English when they are just starting, and a fun watch for kids who already speak it. Every video comes from an approved creator and is reviewed by the Kuchu Puchu team before it goes live, with no ads. A grown-up can choose which languages to show, so English can sit alongside Hindi, Punjabi or your home language.",
    videosHeading: "Watch Kuchu Puchu Videos in English",
    topicsHeading: "Browse English Videos by Topic",
    topicsText: "English videos on Kuchu Puchu cover early learning, simple science, art, games, cartoons, poems and good manners. Kids can learn colors with fruits, count with ducklings, mix colors in an art class and find out how a rainbow gets its 7 colors. There are also videos about hot and cold weather, outdoor games, food names, sharing and greeting elders.",
    learnHeading: "Why Kids Enjoy Kuchu Puchu in English",
    learn: [
      {
        title: "Colors, Counting and Food Words",
        text: "Kids learn colors with the help of fruits, count along with ducklings and pick up English names for everyday foods they see at home."
      },
      {
        title: "Little Science Lessons",
        text: "Videos about hot and cold weather, and about how a rainbow gets its 7 colors, give curious kids simple answers to big questions."
      },
      {
        title: "Art and Outdoor Play",
        text: "An art class shows what happens when two colors mix, and outdoor game videos give kids fresh ideas for running and playing outside."
      },
      {
        title: "Funny Animal Classes",
        text: "Animal school cartoons are silly and fun, like a lion teacher who asks the class a really hard math question. Kids laugh and hear English words at the same time."
      },
      {
        title: "Poems and Good Manners",
        text: "English poem videos give kids short lines to say along. Videos about sharing with farm animals and greeting elders show kind, polite ways to behave."
      }
    ],
    ctaHeading: "Watch Kuchu Puchu in English in the App",
    ctaText: "Get the free Kuchu Puchu app on Android or iPhone and choose English behind the grown-ups check. Kids can start watching without an account.",
    tipsHeading: "Tips for Learning English Alongside a Home Language",
    tips: [
      {
        title: "Keep Your Home Language Strong",
        text: "If your family speaks Hindi, Punjabi or another language at home, keep using it every day. Kids can learn English and still keep their home language."
      },
      {
        title: "Use English in Real Moments",
        text: "Name colors at the fruit stall, count the stairs or talk about the weather in English. Short, everyday phrases are often easier for young kids to remember than long lessons."
      },
      {
        title: "Watch, Pause and Say It",
        text: "Watch a short English video together, pause and say a new word out loud. Use that word again later in the day, so your child hears it in real life too."
      }
    ],
    faqs: [
      {
        q: "Does Kuchu Puchu have English videos for kids?",
        a: "Yes. Kuchu Puchu has English videos for kids aged 3 to 8, about colors, counting, food names, weather, art, outdoor games, good manners and more. You can watch them on this page, on the website or in the free app for Android and iPhone. A grown-up can choose English as a language to show."
      },
      {
        q: "Can Kuchu Puchu help my child learn English?",
        a: "Kuchu Puchu kids learning videos in English are a fun way to hear everyday words for colors, numbers, food and weather. They work best when a grown-up watches along, says the words out loud and uses them again at home. Short videos, watched often, can make English feel like play instead of a lesson."
      },
      {
        q: "Which languages is Kuchu Puchu in?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more languages. A grown-up can choose which ones to show, so your child can watch English along with the language your family speaks at home."
      },
      {
        q: "How do I choose which languages my child sees?",
        a: "In the Kuchu Puchu app, open the settings behind the grown-ups check and pick English on its own, or English with another language such as Hindi or Punjabi. On the website, use the language filter on the Explore page, where you can add one language or several. You can change your choice at any time."
      },
      {
        q: "Is Kuchu Puchu free?",
        a: "Yes. Kuchu Puchu is free on the website and in the app for Android and iPhone, with no subscription, no in-app purchases and no ads. Kids need no account to watch English videos."
      }
    ],
    related: [
      "learn-languages",
      "school-classroom",
      "sports-play",
      "good-habits"
    ]
  }

];

export const categoryContent = (dbSlug: string) => CATEGORY_CONTENT.find(c => c.dbSlug === dbSlug);
