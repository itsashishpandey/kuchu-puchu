"use client";

import { Hero, StatsBand, HowItWorks } from "./home-hero";
import { TrendingMarquee, FreshDrops } from "./home-rails";
import { EarningsCalculator, TopCreators } from "./home-calculator";
import { UploadAndEarn } from "./home-creator-appeal";
import { DiscoverInYourLanguage, SomethingForEveryInterest } from "./home-discovery";
import { FAQ, FinalCTA } from "./home-faq";
import { useReveal } from "@/components/app/router";
import { usePublicSettings } from "@/lib/use-public-settings";

export function Home() {
  const setRef = useReveal<HTMLDivElement>();
  const { homepage } = usePublicSettings();

  return (
    <div ref={setRef}>
      {/* video-first: the platform itself leads, monetization appeal follows */}
      <Hero announcement={homepage?.announcement} />
      <TrendingMarquee />
      <DiscoverInYourLanguage />
      <SomethingForEveryInterest />
      <StatsBand />
      <HowItWorks />
      <UploadAndEarn />
      <EarningsCalculator />
      <FreshDrops />
      <TopCreators />
      <FAQ />
      <FinalCTA />
      {/* Section 16: Newsletter + footer render in the shared Footer */}
    </div>
  );
}
