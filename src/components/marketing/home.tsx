"use client";

import { useEffect, useState } from "react";
import { Hero, StatsBand, HowItWorks } from "./home-hero";
import { TrendingMarquee, FreshDrops } from "./home-rails";
import { EarningsCalculator, TopCreators } from "./home-calculator";
import { UploadAndEarn } from "./home-creator-appeal";
import {
  SuccessStories, DashboardPreview, VideoCategories, CreatorCommunity,
} from "./home-benefits";
import { FAQ, FinalCTA } from "./home-faq";
import { useReveal } from "@/components/app/router";
import { get } from "@/lib/client";

export function Home() {
  const setRef = useReveal<HTMLDivElement>();
  const [rates, setRates] = useState({ ratePer1000Views: 1, rewardPerUpload: 0.5 });
  const [homepage, setHomepage] = useState<{ announcement?: string } | null>(null);

  useEffect(() => {
    get<{ ratePer1000Views: number; rewardPerUpload: number; homepage: { announcement?: string } | null }>("/public/settings")
      .then(d => {
        setRates({ ratePer1000Views: d.ratePer1000Views, rewardPerUpload: d.rewardPerUpload });
        setHomepage(d.homepage);
      }).catch(() => {});
  }, []);

  return (
    <div ref={setRef}>
      {/* video-first: the platform itself leads, monetization appeal follows */}
      <Hero announcement={homepage?.announcement} />
      <TrendingMarquee />
      <StatsBand />
      <HowItWorks />
      <UploadAndEarn rate={rates.ratePer1000Views} reward={rates.rewardPerUpload} />
      <EarningsCalculator />
      <FreshDrops />
      <TopCreators />
      <VideoCategories />
      <SuccessStories />
      <DashboardPreview />
      <CreatorCommunity />
      <FAQ />
      <FinalCTA />
      {/* Section 16: Newsletter + footer render in the shared Footer */}
    </div>
  );
}
