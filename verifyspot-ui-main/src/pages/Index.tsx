import ForensicsHeader from "@/components/ForensicsHeader";
import UploadSection from "@/components/UploadSection";
import AnalysisResults from "@/components/AnalysisResults";
//import CommunitySection from "@/components/CommunitySection";
import PrivacySection from "@/components/PrivacySection";
import ForensicsFooter from "@/components/ForensicsFooter";
import HistoryCarousel from "@/components/HiatoryCarousel"; // ✅ new import

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ForensicsHeader />
      <main>
        <UploadSection />

        {/* ✅ New horizontally scrollable history section */}
        <HistoryCarousel />

        <AnalysisResults />

        <PrivacySection />
      </main>
      <ForensicsFooter />
    </div>
  );
};

export default Index;
