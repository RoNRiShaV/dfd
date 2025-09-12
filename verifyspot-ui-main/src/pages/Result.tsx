import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AnalysisResults from "@/components/AnalysisResults";
import ForensicsHeader from "@/components/ForensicsHeader";
import ForensicsFooter from "@/components/ForensicsFooter";

const Result = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Backend endpoint
        const backendUrl = `http://localhost:8000/api/result/${id}`;
        console.log("Fetching report from:", backendUrl);

        const res = await fetch(backendUrl);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch report");
        }

        const json = await res.json();

        // ✅ Ensure frontend has correct image + heatmap URLs
        const processed = {
          ...json,
          image_url: json.image_url
            ? `http://localhost:8000/${json.image_url}` // if backend returns relative path
            : null,
          heatmap_url: json.heatmap_url
            ? `http://localhost:8000/${json.heatmap_url}`
            : null,
        };

        setReport(processed);
      } catch (err: any) {
        console.error("Error fetching report:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
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
        {!loading && error && (
          <div className="container mx-auto px-6 text-red-500">
            {error}
          </div>
        )}
        {!loading && report && <AnalysisResults data={report} />}
        {!loading && !error && !report && (
          <div className="container mx-auto px-6">Report not found</div>
        )}
      </main>
      <ForensicsFooter />
    </div>
  );
};

export default Result;
