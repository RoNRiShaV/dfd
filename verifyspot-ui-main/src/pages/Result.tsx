import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AnalysisResults from "@/components/AnalysisResults";
import ForensicsHeader from "@/components/ForensicsHeader";
import ForensicsFooter from "@/components/ForensicsFooter";

const Result = () => {
  const { id } = useParams();
  console.log("ID from URL params:", id);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      setLoading(true);

      const backendUrl = `http://localhost:8000/api/result/${id}`;  // ✅ Explicit backend URL
      console.log("Fetching from URL:", backendUrl);

      const res = await fetch(backendUrl);

      if (res.ok) {
        const json = await res.json();
        json.image_url = `/api/uploads/${json.filename}`;  // Augment image URL
        setReport(json);
      } else {
        const text = await res.text();
        console.error("Failed to load report:", text);
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
        {loading && <div className="container mx-auto px-6">Loading report...</div>}
        {!loading && report && (
          <AnalysisResults data={report} />
        )}
        {!loading && !report && (
          <div className="container mx-auto px-6">Report not found</div>
        )}
      </main>
      <ForensicsFooter />
    </div>
  );
};

export default Result;
