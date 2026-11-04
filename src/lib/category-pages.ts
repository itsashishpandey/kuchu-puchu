// The written text of the 15 category landing pages (addresses, titles and descriptions are in
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
};

export const CATEGORY_CONTENT: CategoryContent[] = [
  {
    dbSlug: "cartoons-animation",
    h1: "Kuchu Puchu Funny Cartoons & Animation for Kids",
    intro: "Kuchu Puchu Cartoons are short, gentle cartoons for kids, full of funny moments and happy little adventures. They are made for children aged 3 to 8, with no violence, no scary scenes and no ads. Every video is reviewed by the Kuchu Puchu team before it goes live, so your child can watch and laugh in a calm, friendly place.",
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
    faqs: [
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
      {
        q: "Which languages are Kuchu Puchu cartoons in?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more languages. A grown-up can choose which languages to show, so your child sees cartoons in the languages your family speaks at home."
      }
    ],
    related: [
      "stories",
      "kids-comedy",
      "animals",
      "rhymes-songs"
    ]
  },
  {
    dbSlug: "rhymes-songs",
    h1: "Kuchu Puchu Nursery Rhymes & Songs for Kids",
    intro: "Kuchu Puchu Nursery Rhymes is the home of nursery rhymes for kids, sing-along songs, action songs, lullabies and simple learning songs. They are made for children aged 3 to 8, and Kuchu Puchu has videos in Hindi, English, Punjabi and more. Every video is short, ad-free and reviewed by the Kuchu Puchu team, so little ones can sing, clap and move along happily.",
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
    h1: "Kuchu Puchu Drawing and Craft Videos for Kids",
    intro: "This is the place for Kuchu Puchu drawing videos for kids, with simple drawing, coloring, painting and easy crafts for kids to make at home. The videos are short, free and made for children aged 3 to 8, and every one is reviewed before it goes live. For any craft with scissors or glue, a grown-up should help.",
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
    faqs: [
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
    h1: "Kuchu Puchu Language Videos for Kids",
    intro: "Kuchu Puchu Language videos for kids are short clips about first words and simple phrases in English, Hindi and more. They are made for children aged 3 to 8, whether your child is starting to learn Hindi, picking up English words, or enjoying a home language. Every video is free and ad-free, and a grown-up can choose which languages to show.",
    videosHeading: "Watch Kuchu Puchu Language Videos",
    topicsHeading: "Language Topics for Little Ones",
    topicsText: "Choose a topic to focus on one language at a time, or mix two together. Topics include Learn English, Learn Hindi, Learn Other Languages and Bilingual Stories.",
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
        q: "Which languages can kids watch on Kuchu Puchu?",
        a: "Kuchu Puchu has videos in Hindi, English, Punjabi, Haryanvi, Urdu and more. A grown-up can choose which languages to show, so your child sees videos in the languages your family speaks or wants to learn. Language settings in the app are behind a check for grown-ups."
      },
      {
        q: "How can videos help my child learn new words?",
        a: "Short videos give kids a fun way to hear new words and see what they mean. Watch together when you can, pause to say words out loud, and use them later at home. Kuchu Puchu Language videos are short, free and ad-free, so they fit easily into a quick, shared watch."
      }
    ],
    related: [
      "stories",
      "rhymes-songs",
      "early-learning",
      "our-world"
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
  }
];

export const categoryContent = (dbSlug: string) => CATEGORY_CONTENT.find(c => c.dbSlug === dbSlug);
