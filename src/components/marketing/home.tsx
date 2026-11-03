"use client";

import { useEffect, useState } from "react";
import { Hero, StatsBand, HowItWorks } from "./home-hero";
import { TrendingMarquee, FreshDrops } from "./home-rails";
import { EarningsCalculator, TopCreators } from "./home-calculator";
import { UploadAndEarn } from "./home-creator-appeal";
import { DiscoverInYourLanguage, SomethingForEveryInterest } from "./home-discovery";
import { FAQ, FinalCTA } from "./home-faq";
import { useReveal } from "@/components/app/router";
import { get } from "@/lib/client";

export function Home() {
  const setRef = useReveal<HTMLDivElement>();
  const [rates, setRates] = useState({ ratePer1000Views: 1, rewardPerUpload: 0.32, rewardPerUploadInr: 30 });
  const [homepage, setHomepage] = useState<{ announcement?: string } | null>(null);

  useEffect(() => {
    get<{ ratePer1000Views: number; rewardPerUpload: number; rewardPerUploadInr: number; homepage: { announcement?: string } | null }>("/public/settings")
      .then(d => {
        setRates({ ratePer1000Views: d.ratePer1000Views, rewardPerUpload: d.rewardPerUpload, rewardPerUploadInr: d.rewardPerUploadInr });
        setHomepage(d.homepage);
      }).catch(() => {});
  }, []);

  return (
    <div ref={setRef}>
      {/* video-first: the platform itself leads, monetization appeal follows */}
      <Hero announcement={homepage?.announcement} />
      <TrendingMarquee />
      <DiscoverInYourLanguage />
      <SomethingForEveryInterest />
      <StatsBand />
      <HowItWorks />
      <UploadAndEarn rate={rates.ratePer1000Views} reward={rates.rewardPerUpload} rewardInr={rates.rewardPerUploadInr} />
      <EarningsCalculator />
      <FreshDrops />
      <TopCreators />
      <FAQ />
      <FinalCTA />
      {/* Section 16: Newsletter + footer render in the shared Footer */}
    </div>
  );
}
