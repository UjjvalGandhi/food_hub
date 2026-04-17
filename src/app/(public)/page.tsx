import dynamic from "next/dynamic";
import { CurrentOrderSpotlight } from "@/components/home/CurrentOrderSpotlight";
import { HeroSection } from "@/components/home/HeroSection";

// Lazy-load below-the-fold sections for better performance
const HowItWorks = dynamic(() => import("@/components/home/HowItWorks").then(mod => mod.HowItWorks));
const FeaturedRestaurants = dynamic(() => import("@/components/home/FeaturedRestaurants").then(mod => mod.FeaturedRestaurants));
const PopularDishes = dynamic(() => import("@/components/home/PopularDishes").then(mod => mod.PopularDishes));
const Testimonials = dynamic(() => import("@/components/home/Testimonials").then(mod => mod.Testimonials));
const CtaSection = dynamic(() => import("@/components/home/CtaSection").then(mod => mod.CtaSection));

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <CurrentOrderSpotlight />
      <HowItWorks />
      <FeaturedRestaurants />
      <PopularDishes />
      <Testimonials />
      <CtaSection />
    </div>
  );
}
