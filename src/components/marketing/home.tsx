"use client";

import { useEffect, useState } from "react";
import { Hero, LiveEarnings, HowItWorks } from "./home-hero";
import { EarningsCalculator, TrendingVideos, TopCreators } from "./home-calculator";
import {
  WhyJoin, EarnPerUpload, EarnFromViews, SuccessStories,
  DashboardPreview, VideoCategories, CreatorCommunity,
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
      <Hero announcement={homepage?.announcement} />
      <LiveEarnings />
      <HowItWorks />
      <EarningsCalculator />
      <TrendingVideos />
      <TopCreators />
      <WhyJoin />
      <EarnPerUpload reward={rates.rewardPerUpload} />
      <EarnFromViews rate={rates.ratePer1000Views} />
      <SuccessStories />
      <DashboardPreview />
      <VideoCategories />
      <CreatorCommunity />
      <FAQ />
      <FinalCTA />
      {/* Section 16: Newsletter + footer render in the shared Footer */}
    </div>
  );
}
