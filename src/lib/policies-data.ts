// Policy texts — shared by the in-app policy pages (#/policies/<slug>) and the plain server-rendered
// /privacy and /terms pages that store reviewers and crawlers can read without JavaScript.
// {placeholders} such as {uploadReward} are filled with the live admin numbers (in USD) — see livePolicy().
import { fillNumbers, type PublicSettings } from "@/lib/public-settings";

export type PolicySection = { h: string; p: string[]; list?: string[] };
export type Policy = { title: string; intro: string; updated: string; sections: PolicySection[] };

export const POLICIES: Record<string, Policy> = {
  monetization: {
    title: "Creator Earnings & Monetization Policy",
    intro: "How views, uploads and payouts turn into money — the complete, plain-language rules. All amounts are in US dollars.",
    updated: "Last updated: November 3, 2026",
    sections: [
      {
        h: "1. Who can earn",
        p: ["Only approved creators with monetization in good standing can earn on Kuchu Puchu. Accounts that are pending, rejected or suspended cannot upload or earn, and their content does not generate view revenue."],
        list: [
          "Creator account status must be APPROVED.",
          "Videos must be approved and original — duplicates never earn.",
          "Channels flagged for fraud may have monetization paused pending review.",
        ],
      },
      {
        h: "2. View revenue",
        p: [
          "Creators earn {rate} per 1,000 qualified views (the current rate). Earnings are calculated proportionally per qualified view event — we never round down to complete thousands.",
          "A view is qualified when a real viewer watches {whereViewsCount} with genuine watch time. The same viewer counts once per video {repeatWindow}, and one internet connection (for example a home Wi-Fi) adds at most {networkCap} views per video in that time; repeat plays in between, {websitePlays}bot traffic and creator self-views don't count. Kuchu Puchu may adjust these rules in the admin settings.",
        ],
      },
      {
        h: "3. Upload rewards",
        p: ["Each approved original upload earns a one-time reward of {uploadReward}, exactly once per video after approval. Re-uploads, duplicates and re-encoding of existing content never receive rewards."],
      },
      {
        h: "3a. Unlocking earnings",
        p: ["A channel unlocks earning — upload rewards and view earnings — the first time it has at least {unlockViews} genuine views within 30 days, and stays unlocked after that. Creator self-views, bots, automated refreshes, {websitePlays}and repeat plays by the same viewer within the repeat window don't count. Uploads approved before a channel unlocks earning don't receive an upload reward."],
      },
      {
        h: "3b. Complaints and strikes",
        p: ["Creators are responsible for everything they upload. Kuchu Puchu may remove content without notice when a complaint is upheld or the content breaks the Community Guidelines. Each upheld complaint is a strike on the channel; 3 active strikes suspend the channel, and it may be permanently deleted. Strikes can be appealed via support@mykuchupuchu.com."],
      },
      {
        h: "4. Earning duration",
        p: ["View revenue accrues for {months} from a video's first publication date. After the window expires the video remains publicly available but stops generating new view earnings."],
      },
      {
        h: "5. Holding period & balances",
        p: [
          "Newly credited earnings are pending for {holdDays} days (fraud-review holding period) before becoming available.",
          "Available balance = credited earnings past holding, minus funds locked in active withdrawal requests.",
        ],
      },
      {
        h: "6. Rate changes & history",
        p: ["Every earning stores the rate in effect when it was credited. Rate changes apply only to future qualified views and are announced to all creators in advance. Finalized earnings are never recalculated."],
      },
      {
        h: "7. Disallowed earnings",
        p: ["Earnings are reversed or withheld for duplicate or unoriginal content, artificially inflated views, engagement schemes, or videos removed for policy violations. Withheld rewards are never paid retroactively after removal."],
      },
    ],
  },
  community: {
    title: "Community Guidelines",
    intro: "Kuchu Puchu is only for children aged 3–8. These rules keep it safe, original and joyful for them.",
    updated: "Last updated: November 2, 2026",
    sections: [
      {
        h: "1. Made for kids aged 3–8",
        p: ["Every video must be made for young children and be suitable for a 3-year-old to watch without an adult explaining it. Cartoons, rhymes, stories, early learning, animals, crafts, dance, gentle comedy and family-friendly activities are what belong here."],
        list: [
          "No violence, weapons, blood, frightening or horror content — even as a joke",
          "No bad language, insults, romance, dating, or adult themes",
          "No ads, sponsorships, product promotion, unboxing for brands, or calls to buy anything",
          "No links, phone numbers, social handles or requests for kids to contact anyone or visit another site",
          "No dangerous acts, challenges or stunts a child could copy",
          "No content showing a child in an unsafe, embarrassing or exploitative way",
        ],
      },
      {
        h: "2. Be original",
        p: ["Only upload content you created or have clear rights to use. Re-uploading, re-encoding or slightly modifying someone else's video is not original — our fingerprinting will find it."],
      },
      {
        h: "3. Be authentic",
        p: ["No engagement schemes: view bots, engagement pods, misleading thumbnails or bait-and-switch titles. Genuine engagement is the only kind that pays."],
      },
      {
        h: "4. Children on camera",
        p: ["If a child appears in your video, you must be their parent or guardian or have their parent's written consent. Never show a child's full name, school, home or location. Sexual content involving minors results in immediate removal, a permanent ban and legal reporting."],
      },
      {
        h: "5. No comments, no messaging",
        p: ["To keep kids safe, comments are turned off across Kuchu Puchu and there is no messaging between users. Parents can report any video from the app or website."],
      },
      {
        h: "6. Enforcement",
        p: [
          "Every video is reviewed before it reaches kids. Videos that break these rules are removed, and each upheld complaint is a strike. 3 active strikes suspend the channel, and it may be permanently deleted.",
          "Serious violations skip steps. You can appeal any decision through dashboard appeals or support.",
        ],
      },
    ],
  },
  copyright: {
    title: "Copyright & Content Policy",
    intro: "You own your content. Here's exactly what that means — and how we protect it.",
    updated: "Last updated: November 1, 2026",
    sections: [
      {
        h: "1. Ownership",
        p: ["Creators retain full ownership of uploaded content. By uploading, you grant Kuchu Puchu a non-exclusive license to host, stream, display and monetize your videos on the platform. Nothing more."],
      },
      {
        h: "2. Duplicate detection",
        p: [
          "Every upload receives a unique permanent content ID and a three-layer fingerprint: SHA-256 file checksum, perceptual visual hash and audio fingerprint.",
          "Videos matching existing content above the similarity threshold are flagged for human review with a similarity score. Confirmed duplicates are rejected and never earn.",
        ],
      },
      {
        h: "3. Reporting infringement",
        p: ["If your work was re-uploaded without permission, use the Report → Copyright option on the video or email copyright@mykuchupuchu.com. Verified reports result in removal of the infringing copy and forfeiture of any associated earnings."],
      },
      {
        h: "4. Counter-notices & appeals",
        p: ["Flagged creators can appeal from My Videos. A human reviewer examines evidence from both sides within 2 business days. Frivolous mass-reporting is itself a violation."],
      },
      {
        h: "5. Music & third-party material",
        p: ["Use audio you own, licensed or created. Uploads with copyrighted audio detected by fingerprinting are blocked from monetization until replaced or disputed."],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "Kuchu Puchu is made for children aged 3–8. We collect as little as possible, never show ads and never sell data.",
    updated: "Last updated: November 4, 2026",
    sections: [
      {
        h: "1. Children (ages 3–8)",
        p: [
          "Children watch without an account. We do not knowingly collect personal information from children — no name, email, photo, voice, location or contact details — and children cannot post comments, send messages or upload videos.",
          "The Kuchu Puchu app has no accounts at all: no login, no sign-up and no personal information. Chosen languages, watch history, the list of liked videos and hidden videos and channels are saved on the device. The chosen languages are sent with each request for videos so we can show videos in those languages; we don't store them.",
          "The app sends us which videos are watched and for how long, likes, shares, reports and search words. A like adds one to the video's like count, and we keep a record of it so the same device can't like a video twice.",
          "To tell devices apart without knowing who anyone is, our server turns the device's internet address and the app or browser name into a scrambled code (a hash). We store only this code — never the internet address — and it is not linked to a name or account. The code changes when the device changes network (for example from home Wi-Fi to mobile data), and devices on the same connection with the same app version or browser can share one code. We also keep a second code made from the internet address alone, so one home connection can only add a few views to a video.",
          "We use these codes only to count views once, stop fake views and abuse, keep track of likes and reports, and arrange the video feed — never for advertising or tracking.",
          "Search words are stored with the time and the number of videos found, so we can see what children look for and which searches find nothing. They are stored without a device code, an account or an internet address.",
          "If you believe a child has given us personal information — for example by typing it into search — email support@mykuchupuchu.com and we will delete it.",
        ],
      },
      {
        h: "2. No ads, no tracking",
        p: ["There are no ads on Kuchu Puchu — in the app or on the website. We do not use advertising IDs, behavioural advertising, third-party analytics or tracking SDKs, and we do not share data with ad networks or data brokers."],
      },
      {
        h: "3. Parent accounts (website only)",
        p: ["On the website, a parent or guardian aged 18 or over may create a free account to save videos, follow creators and set languages and topics. We collect the parent's name, email, password (stored hashed) and optional country. When a parent is signed in, the videos they watch, like and save and the creators they follow are linked to their account, to show their lists and personalise their feed; searches are never linked to an account. Followers' names and countries are visible to the creators they follow unless the parent chooses private follows."],
      },
      {
        h: "4. Creators (adults only, website only)",
        p: ["Creators must be 18 or over. We collect what's needed to verify and pay them: legal name, email, phone, country, city and PIN code, a government ID document (stored privately and only viewed by our verification team), channel details, uploaded videos, and payout details (stored masked)."],
      },
      {
        h: "5. How we use data",
        p: ["Operating the feed and channels, reviewing every video for child safety, calculating qualified views and creator earnings, preventing fraud, and answering support requests. We never sell personal data."],
        list: [
          "Views, likes and reports are stored with the scrambled device codes described above — never with an internet address.",
          "Payment details are stored masked; full account numbers are never displayed again after entry.",
          "Fraud-detection logic and internal signals are never exposed publicly.",
        ],
      },
      {
        h: "6. Sharing",
        p: ["Only with payout providers (to pay creators), authorities where legally required, and infrastructure providers (hosting, network and email) under data-processing agreements."],
      },
      {
        h: "7. Parents' rights and your controls",
        p: [
          "Parents can see and change their account details, and delete their account and data, at any time from Account Settings. For a copy of your data, email support@mykuchupuchu.com. Deleting an account removes personal data; anonymous totals such as view and like counts stay.",
          "In the app, grown-ups can clear the watch history and liked videos and show hidden videos again from the Grown-ups screen, and deleting the app removes everything saved on the device. Likes already counted stay in the video's like count.",
        ],
      },
      {
        h: "8. Retention",
        p: [
          "Creator earnings and transaction records are kept 7 years for accounting. Creator ID documents are kept while the creator account exists and deleted when it is deleted. Website sign-ins expire after 14 days.",
          "Recommendation signals (which videos were watched, liked or shared) are deleted after 180 days. View records used to count views and pay creators, like records, reports and search words have no fixed deletion date: we keep them while we need them to count views, check creator earnings, improve search and keep Kuchu Puchu safe. Records from the app never include a name, an account or an internet address.",
        ],
      },
      {
        h: "9. Contact",
        p: ["The Kuchu Puchu website and app are operated by Triple Minds Pvt Ltd · support@mykuchupuchu.com. We follow children's privacy laws including COPPA (US), GDPR-K (EU/UK) and India's DPDP Act."],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "The agreement between you and Kuchu Puchu — in readable English.",
    updated: "Last updated: November 2, 2026",
    sections: [
      {
        h: "1. Eligibility",
        p: ["Kuchu Puchu is made for children aged 3–8, who watch without an account under a parent's supervision. Parent accounts and creator accounts are for adults aged 18 or over who can form a binding contract. One creator account per person."],
      },
      {
        h: "2. Your account",
        p: ["Keep credentials secure; you're responsible for activity on your account. Channel names and usernames must not infringe trademarks or impersonate others."],
      },
      {
        h: "3. Content standards",
        p: ["Every video must be made for children aged 3–8 and comply with our Community Guidelines and Copyright Policy. You retain ownership and grant us the limited platform license described there."],
      },
      {
        h: "4. Monetization",
        p: ["Earnings follow the Monetization Policy. Rates may change with notice; stored earnings keep their original rates. We may withhold or reverse earnings tied to fraud or policy violations."],
      },
      {
        h: "5. Termination",
        p: ["You may delete your account anytime. We may suspend accounts for violations, with reason and an appeal path wherever legally required."],
      },
      {
        h: "6. Liability & disputes",
        p: ["The service is provided 'as is'. Our aggregate liability is limited to your lifetime platform earnings. Disputes are resolved per the governing law noted in your payout region."],
      },
    ],
  },
  payment: {
    title: "Payment & Withdrawal Policy",
    intro: "How money moves from your balance to your bank. All amounts are in US dollars.",
    updated: "Last updated: November 3, 2026",
    sections: [
      {
        h: "1. Balances",
        p: [
          "Pending: credited earnings inside the {holdDays}-day holding period, plus funds locked in active withdrawal requests.",
          "Available: withdrawable funds. Lifetime: everything you've ever earned.",
        ],
      },
      {
        h: "2. Requesting a withdrawal",
        p: ["Minimum withdrawal is {minPayout} (configurable by the platform). Requests are submitted to your saved payout method — bank transfer (ACH/SEPA) or PayPal, subject to regional availability. Your available balance is immediately reduced by the requested amount."],
      },
      {
        h: "3. Processing stages",
        p: ["Requested → Under Review → Approved → Processing → Paid. Each stage is visible in your dashboard with timestamps. Rejected requests return funds to your available balance with a stated reason."],
      },
      {
        h: "4. Timelines & references",
        p: ["Bank payouts arrive 3–5 business days after approval; PayPal 1–3. Every payment carries a reference (PAY-…) that support can trace end-to-end."],
      },
      {
        h: "5. Duplicate payout prevention",
        p: ["Each withdrawal can be paid exactly once. Our ledger enforces one payout per withdrawal record, and every payout is recorded as an immutable ledger transaction."],
      },
      {
        h: "6. Taxes",
        p: ["You're responsible for your taxes. Where required by law, we may collect tax information and issue statements before processing payouts."],
      },
    ],
  },
};

/** A policy with its {placeholders} filled with the live numbers. */
export function livePolicy(policy: Policy, s: PublicSettings): Policy {
  const f = (t: string) => fillNumbers(t, s);
  return {
    ...policy,
    title: f(policy.title),
    intro: f(policy.intro),
    sections: policy.sections.map(sec => ({ h: f(sec.h), p: sec.p.map(f), list: sec.list?.map(f) })),
  };
}
