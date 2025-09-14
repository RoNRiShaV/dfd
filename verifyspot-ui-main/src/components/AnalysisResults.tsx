import { Camera, Calendar, MapPin, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface ReverseMatch {
  source: string;
  similarity?: string;
  date?: string;
}

interface AnalysisData {
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
}

const AnalysisResults = ({ data }: { data?: AnalysisData }) => {
  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No analysis data available.
      </div>
    );
  }

  const [showHeatmap, setShowHeatmap] = useState(false);

  const exif = data.exif ?? {};
  const reverseMatches = data.reverse_matches ?? [];

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">Analysis Results</h2>
        <p className="text-muted-foreground">
          Comprehensive forensic analysis of your uploaded content
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-accent-strong" />
              <span>Metadata Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(exif).length > 0 ? (
              Object.entries(exif).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{key}</span>
                  <span>{String(value)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No EXIF metadata available</p>
            )}
          </CardContent>
        </Card>

        {/* Authenticity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span>Authenticity Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845 a15.9155,15.9155 0 0,1 0,31.831a15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="2"
                />
                <path
                  d="m18,2.0845 a15.9155,15.9155 0 0,1 0,31.831a15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="hsl(var(--warning))"
                  strokeWidth="2"
                  strokeDasharray={`${Math.round(data.authenticity ?? 0)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">
                  {Math.round(data.authenticity ?? 0)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {(data.authenticity ?? 0) > 70 ? "Likely Genuine" : "Suspicious"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Preview + Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Image Preview</span>
              {data.heatmap_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                >
                  {showHeatmap ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
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
                <div className="w-full h-48 bg-muted flex items-center justify-center">
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
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Deepfake Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {data.real_prob != null && data.fake_prob != null ? (
            <div>
              <p>Prediction: <strong>{data.prediction}</strong></p>
              <p className="text-sm mt-2">Real Probability: {(data.real_prob * 100).toFixed(2)}%</p>
              <Progress value={(data.real_prob ?? 0) * 100} className="mb-2" />
              <p className="text-sm">Fake Probability: {(data.fake_prob * 100).toFixed(2)}%</p>
              <Progress value={(data.fake_prob ?? 0) * 100} />
            </div>
          ) : (
            <p className="text-muted-foreground">Deepfake analysis not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Reverse Search */}
      {reverseMatches.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reverse Image Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {reverseMatches.map((result, i) => (
                <div key={i} className="border rounded p-4">
                  <p className="font-medium">{result.source}</p>
                  {result.similarity && (
                    <Badge>{result.similarity}</Badge>
                  )}
                  {result.date && (
                    <p className="text-xs text-muted-foreground flex items-center">
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
    </div>
  );
};

export default AnalysisResults;
