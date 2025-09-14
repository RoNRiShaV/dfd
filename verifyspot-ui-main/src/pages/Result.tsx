import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AnalysisResults from "@/components/AnalysisResults";
import ForensicsHeader from "@/components/ForensicsHeader";
import ForensicsFooter from "@/components/ForensicsFooter";

interface ReportData {
  id?: string;
  filename?: string;
  image_url?: string;
  heatmap_url?: string;
  tamper_score?: number;
  exif?: Record<string, string>;
  reverse_matches?: Array<{
    source: string;
    similarity?: string;
    date?: string;
  }>;
  prediction?: string;
  authenticity?: number;
  real_prob?: number;
  fake_prob?: number;
}

const Result = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        // ✅ Use environment variable instead of hardcoded localhost
        const backendBase = import.meta.env.VITE_API_URL;
        const backendUrl = `${backendBase}/api/result/${id}`;
        const res = await fetch(backendUrl);

        if (res.ok) {
          const json: any = await res.json();

          // Normalize URLs
          if (json.filename) {
            json.image_url = `${backendBase}/api/uploads/${json.filename}`;
          }
          if (json.heatmap_url) {
            json.heatmap_url = json.heatmap_url.startsWith("http")
              ? json.heatmap_url
              : `${backendBase}${json.heatmap_url}`;
          }

          setReport(json);
        } else {
          setReport(null);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setReport(null);
      }
      setLoading(false);
    };

    fetchReport();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <ForensicsHeader />
      <main className="py-8">
        {loading && (
          <div className="container mx-auto px-6">Loading report...</div>
        )}
        {!loading && report && <AnalysisResults data={report} />}
        {!loading && !report && (
          <div className="container mx-auto px-6">Report not found</div>
        )}
      </main>
      <ForensicsFooter />
    </div>
  );
};

export default Result;
