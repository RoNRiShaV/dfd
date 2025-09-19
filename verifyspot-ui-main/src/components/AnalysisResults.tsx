import { useState, useEffect } from "react";
import {
  Camera,
  Calendar,
  AlertTriangle,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Search,
  FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ReverseMatch {
  source: string;
  similarity?: string;
  date?: string;
}

interface AnalysisData {
  id?: string;
  filename?: string;
  image_url?: string;
  heatmap_url?: string;
  exif?: Record<string, string>;
  tamper_score?: number;
  reverse_matches?: ReverseMatch[];
  prediction?: string;
  authenticity?: number;
  real_prob?: number;
  fake_prob?: number;
  reverse?: {
    tineye?: string;
  };
}

interface VoteData {
  votes_real: number;
  votes_fake: number;
  total: number;
}

const AnalysisResults = ({ data }: { data?: AnalysisData }) => {
  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400">
        No analysis data available.
      </div>
    );
  }

  const backendBase = "http://localhost:8000";

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [votes, setVotes] = useState<VoteData>({
    votes_real: 0,
    votes_fake: 0,
    total: 0,
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const exif = data.exif ?? {};
  const reverseMatches = data.reverse_matches ?? [];

  useEffect(() => {
    if (!data?.id) return;
    fetch(`${backendBase}/api/votes/${data.id}`)
      .then((res) => res.json())
      .then((json) => setVotes(json))
      .catch((err) => console.error("Votes fetch error:", err));
  }, [data?.id]);

  const handleVote = async (type: "real" | "fake") => {
    if (!data?.id) return;
    try {
      const res = await fetch(`${backendBase}/api/vote/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: type }),
      });
      const updated = await res.json();
      setVotes(updated);
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  const handleGeneratePDF = async () => {
    if (!data?.id) return;
    setIsGeneratingPDF(true);
    try {
      const res = await fetch(`${backendBase}/api/report/${data.id}`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.filename?.replace(/\.[^/.]+$/, "") || "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const realPercent =
    votes.total > 0 ? (votes.votes_real / votes.total) * 100 : 0;
  const fakePercent =
    votes.total > 0 ? (votes.votes_fake / votes.total) * 100 : 0;

  // ✅ Always open TinEye homepage (no image URL attached)
  const tineyeUrl = "https://tineye.com/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white px-6 py-12">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Analysis Results</h2>
        <p className="text-gray-400">
          Comprehensive forensic analysis of your uploaded content
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Metadata */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Camera className="w-5 h-5 text-purple-400" />
              <span>Metadata Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(exif).length > 0 ? (
              Object.entries(exif).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-400">{key}</span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No EXIF metadata available</p>
            )}
          </CardContent>
        </Card>

        {/* Authenticity */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span>Authenticity Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative w-32 h-32 mx-auto">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="m18,2.0845 a15.9155,15.9155 0 0,1 0,31.831a15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                />
                <path
                  d="m18,2.0845 a15.9155,15.9155 0 0,1 0,31.831a15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="2"
                  strokeDasharray={`${Math.round(data.authenticity ?? 0)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-yellow-400">
                  {Math.round(data.authenticity ?? 0)}%
                </span>
                <span className="text-xs text-gray-400">
                  {(data.authenticity ?? 0) > 70
                    ? "Likely Genuine"
                    : "Suspicious"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Preview */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-white">
              <span>Image Preview</span>
              {data.heatmap_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border border-pink-500/40 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition backdrop-blur-sm"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                >
                  {showHeatmap ? (
                    <EyeOff className="w-4 h-4 mr-1" />
                  ) : (
                    <Eye className="w-4 h-4 mr-1" />
                  )}
                  {showHeatmap ? "Hide" : "Show"} Heatmap
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded overflow-hidden">
              {data.image_url ? (
                <img
                  src={data.image_url}
                  alt="Uploaded"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              {showHeatmap && data.heatmap_url && (
                <img
                  src={data.heatmap_url}
                  alt="Heatmap"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deepfake Analysis */}
      <Card className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Deepfake Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {data.real_prob != null && data.fake_prob != null ? (
            <div>
              <p className="mb-2 text-gray-300">
                Prediction:{" "}
                <Badge
                  className={`${
                    data.prediction === "real"
                      ? "bg-emerald-500/30 text-emerald-300"
                      : "bg-pink-500/30 text-pink-300"
                  }`}
                >
                  {data.prediction?.toUpperCase()}
                </Badge>
              </p>

              <p className="text-sm mb-2 text-emerald-300">
                Real Probability:{" "}
                <span className="font-bold text-emerald-400">
                  {(data.real_prob * 100).toFixed(2)}%
                </span>
              </p>
              <Progress
                value={data.real_prob * 100}
                className="mb-4 bg-gray-800/60 rounded-full [&>div]:bg-emerald-400"
              />

              <p className="text-sm mb-2 text-pink-300">
                Fake Probability:{" "}
                <span className="font-bold text-pink-400">
                  {(data.fake_prob * 100).toFixed(2)}%
                </span>
              </p>
              <Progress
                value={data.fake_prob * 100}
                className="bg-gray-800/60 rounded-full [&>div]:bg-pink-400"
              />
            </div>
          ) : (
            <p className="text-gray-400">Deepfake analysis not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Reverse Image Search (TinEye Only) */}
      {data.image_url && tineyeUrl && (
        <Card className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Search className="w-5 h-5 text-blue-400" />
              <span>Reverse Image Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="bg-blue-500/30 text-blue-300 hover:bg-blue-500/40"
            >
              <a href={tineyeUrl} target="_blank" rel="noopener noreferrer">
                TinEye
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reverse Matches */}
      {reverseMatches.length > 0 && (
        <Card className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">
              Reverse Image Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {reverseMatches.map((result, i) => (
                <div
                  key={i}
                  className="border border-white/20 rounded p-4 bg-white/5 backdrop-blur-sm"
                >
                  <p className="font-medium">{result.source}</p>
                  {result.similarity && (
                    <Badge className="bg-purple-500/30 text-purple-300">
                      {result.similarity}
                    </Badge>
                  )}
                  {result.date && (
                    <p className="text-xs text-gray-400 flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {result.date}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Voting */}
      <Card className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Community Voting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Button
              onClick={() => handleVote("real")}
              className="bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/40"
            >
              <ThumbsUp className="w-4 h-4 mr-2" /> Real
            </Button>
            <Button
              onClick={() => handleVote("fake")}
              className="bg-pink-500/30 text-pink-300 hover:bg-pink-500/40"
            >
              <ThumbsDown className="w-4 h-4 mr-2" /> Fake
            </Button>
          </div>

          <p className="text-sm mb-2 text-emerald-300">
            Community thinks this image is Real:{" "}
            <span className="font-bold text-emerald-400">
              {realPercent.toFixed(1)}%
            </span>
          </p>
          <Progress
            value={realPercent}
            className="mb-4 bg-gray-800/60 rounded-full [&>div]:bg-emerald-400"
          />

          <p className="text-sm mb-2 text-pink-300">
            Community thinks this image is Fake:{" "}
            <span className="font-bold text-pink-400">
              {fakePercent.toFixed(1)}%
            </span>
          </p>
          <Progress
            value={fakePercent}
            className="bg-gray-800/60 rounded-full [&>div]:bg-pink-400"
          />
        </CardContent>
      </Card>

      {/* PDF Report Button */}
      {data.id && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="flex items-center bg-blue-500/30 text-blue-300 hover:bg-blue-500/40"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? "Generating..." : "Download PDF Report"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
