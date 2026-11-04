// Homepage text for parents: what kids learn and the parents' FAQ. A plain module (no "use client")
// so the homepage shows it and the server also puts the same FAQ into structured data for search
// engines and AI assistants. Keep every answer true: no invented numbers.

export { SITE_URL } from "@/lib/seo-pages";

export const LEARN_TOPICS = [
  { emoji: "🔤", title: "ABCs & Phonics", slug: "early-learning",
    text: "Alphabet songs and letter videos help kids recognise A to Z and the sound each letter makes." },
  { emoji: "🔢", title: "Counting & Numbers", slug: "early-learning",
    text: "Count along from 1 to 10 and beyond with toys, fruits and friendly animals." },
  { emoji: "🎨", title: "Colors & Shapes", slug: "early-learning",
    text: "Red, blue and yellow, circles, squares and stars: the colors and shapes kids spot every day." },
  { emoji: "🦁", title: "Names of Animals & Things", slug: "animals",
    text: "Learn the names of animals, fruits, vehicles and body parts, and the sounds animals make." },
  { emoji: "🎵", title: "Nursery Rhymes & Poems", slug: "rhymes-songs",
    text: "Sing-along rhymes, action songs and short kids poems that build new words and rhythm." },
  { emoji: "📖", title: "Stories & Moral Stories", slug: "stories",
    text: "Short bedtime stories, fairy tales and moral stories with a simple lesson at the end." },
  { emoji: "💛", title: "Good Habits & Feelings", slug: "good-habits",
    text: "Brushing teeth, sharing, saying sorry and naming feelings: everyday lessons for little ones." },
  { emoji: "🗣️", title: "Hindi & English Words", slug: "learn-languages",
    text: "First words and simple phrases in Hindi, English and other languages families speak at home." },
] as const;

export const PARENT_FAQS = [
  {
    q: "What is Kuchu Puchu?",
    a: "Kuchu Puchu is a free kids video app and website for children aged 3 to 8. It has short, funny educational videos (cartoons, nursery rhymes, poems and stories) that help kids learn ABCs, counting, colors, shapes, the names of animals and things, and good habits. There are no ads, and kids watch without an account.",
  },
  {
    q: "Is the Kuchu Puchu app free?",
    a: "Yes. The Kuchu Puchu app and website are free. There is no subscription, nothing to buy inside the app, and no ads.",
  },
  {
    q: "Is Kuchu Puchu safe for kids?",
    a: "Kuchu Puchu is made only for kids aged 3 to 8. Every creator is approved by our team and videos are reviewed before they go live: no violence, scary or adult content, bad language, ads or product promotion. Comments are turned off, so strangers can't message your child, and parents can report any video.",
  },
  {
    q: "What age is Kuchu Puchu for?",
    a: "Kuchu Puchu is for children aged 3 to 8: preschool, kindergarten and the first years of school. The videos are short, so they suit young attention spans.",
  },
  {
    q: "What can my child learn on Kuchu Puchu?",
    a: "Kids learn the alphabet (ABCs and phonics), counting and numbers, colors and shapes, the names of animals, fruits and everyday things, nursery rhymes and poems, short moral stories, good habits and feelings, and first words in Hindi, English and other languages.",
  },
  {
    q: "Which languages are Kuchu Puchu videos in?",
    a: "Videos are in Hindi, English, Punjabi, Haryanvi, Urdu and more, and new languages arrive as creators upload. In the app, a grown-up can choose which languages to show.",
  },
  {
    q: "How do I download the Kuchu Puchu app?",
    a: "The Kuchu Puchu app is coming soon to Android and iPhone app stores. Until then, on an Android phone or tablet you can tap \"download the Android APK file\" on mykuchupuchu.com and open the file to install it (your phone may ask you to allow installs from your browser). On any phone or computer, kids can also watch free on the website without downloading anything.",
  },
  {
    q: "Does my child need an account to watch?",
    a: "No. Kids watch without signing up. The app opens straight into videos, and settings such as languages and reporting sit behind a grown-ups check.",
  },
  {
    q: "Are there ads on Kuchu Puchu?",
    a: "No. There are no ads in the Kuchu Puchu app or on the website, and we don't use advertising IDs or tracking tools.",
  },
  {
    q: "Who makes the videos on Kuchu Puchu?",
    a: "Independent creators make the videos. Every creator applies and is approved by our team, and creators earn money from qualified views and approved original uploads. If you make videos for kids, you can apply to become a creator.",
  },
] as const;
