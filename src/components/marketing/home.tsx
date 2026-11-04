"use client";

import { Hero, StatsBand, HowItWorks } from "./home-hero";
import { TrendingMarquee, FreshDrops } from "./home-rails";
import { EarningsCalculator, TopCreators } from "./home-calculator";
import { UploadAndEarn } from "./home-creator-appeal";
import { DiscoverInYourLanguage, SomethingForEveryInterest } from "./home-discovery";
import { LearnTopics, ParentTrust, AppDownload, ParentFAQ, CreatorsDivider } from "./home-parents";
import { FAQ, FinalCTA } from "./home-faq";
import { useReveal } from "@/components/app/router";
import { usePublicSettings } from "@/lib/use-public-settings";

export function Home() {
  const setRef = useReveal<HTMLDivElement>();
  const { homepage } = usePublicSettings();

  return (
    <div ref={setRef}>
      {/* Parents and kids first (the page title and search terms are about learning videos for kids);
          the creators' part follows the divider. */}
      <Hero announcement={homepage?.announcement} />
      <TrendingMarquee />
      <LearnTopics />
      <DiscoverInYourLanguage />
      <SomethingForEveryInterest />
      <ParentTrust />
      <FreshDrops />
      <AppDownload />
      <ParentFAQ />

      <CreatorsDivider />
      <UploadAndEarn />
      <HowItWorks />
      <EarningsCalculator />
      <StatsBand />
      <TopCreators />
      <FAQ />
      <FinalCTA />
      {/* Newsletter + footer render in the shared Footer */}
    </div>
  );
}
