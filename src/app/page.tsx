import { TopNav } from "@/components/TopNav";
import { SectionNavigator } from "@/components/SectionNavigator";
import { TechnicalCallouts } from "@/components/TechnicalCallouts";
import { HUD } from "@/components/HUD";
import { Pointer } from "@/components/Cursor";
import { Boot } from "@/components/Boot";
import { ScrollController } from "@/core/ScrollController";
import { Hero } from "@/sections/Hero";
import { Approach } from "@/sections/Approach";
import { Stack } from "@/sections/Stack";
import { Work } from "@/sections/Work";
import { Research } from "@/sections/Research";
import { Journey } from "@/sections/Journey";
import { Contact, Footer } from "@/sections/Contact";

/**
 * One machine, seven views.
 *
 * The scroll controller owns the single timeline: it drives the camera through
 * the assembly, the navigation state, the callout presence and the HUD from
 * one continuous position. Every layer below reads that position; none of them
 * animate on their own schedule.
 */
export default function Page() {
  return (
    <>
      <ScrollController />

      <TechnicalCallouts />
      <HUD />
      <Pointer />
      <TopNav />
      <SectionNavigator />

      <main className="relative z-10">
        <Hero />
        <Approach />
        <Stack />
        <Work />
        <Research />
        <Journey />
        <Contact />
      </main>

      <Footer />
      <Boot />
    </>
  );
}
