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
  heatmap_url?: string;
  exif?: Record<string, string>;
  tamper_score?: number;
  reverse_matches?: ReverseMatch[];
  label?: string;
  authenticity?: number; // 0-100
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

  const backendBase = "http://localhost:8000";

  const imageUrl = data.filename
    ? `${backendBase}/api/uploads/${data.filename}`
    : undefined;

  const heatmapUrl = data.heatmap_url
    ? data.heatmap_url.startsWith("http")
      ? data.heatmap_url
      : `${backendBase}${data.heatmap_url}`
    : undefined;

  const tamperScore = data.tamper_score ?? 0;
  const exif = data.exif ?? {};
  const reverseMatches = data.reverse_matches ?? [];

  const [showHeatmap, setShowHeatmap] = useState(false);

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
        {/* Metadata Card */}
        <Card className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-accent-strong" />
              <span>Metadata Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {Object.entries(exif).length > 0 ? (
                Object.entries(exif).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}</span>
                    <span className="text-sm font-medium">{String(value)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No EXIF metadata available</p>
              )}
            </div>
            <div className="pt-4 border-t border-border">
              <Badge variant="outline" className="border-success text-success">
                <MapPin className="w-3 h-3 mr-1" />
                {Object.entries(exif).length > 0 ? "Metadata Intact" : "No Metadata"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tamper Score Card */}
        <Card className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span>Authenticity Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="2"
                />
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="hsl(var(--warning))"
                  strokeWidth="2"
                  strokeDasharray={`${tamperScore}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-warning">
                  {Math.round(data.authenticity ?? 0)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {(data.authenticity ?? 0) > 70 ? "Likely Genuine" : "Suspicious"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Preview Card */}
        <Card className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Image Preview</span>
              {heatmapUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="border-accent-strong text-accent-strong hover:bg-accent"
                >
                  {showHeatmap ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showHeatmap ? "Hide" : "Show"} Heatmap
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Uploaded content"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  No Image Available
                </div>
              )}
              {showHeatmap && heatmapUrl && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-multiply"
                  style={{ backgroundImage: `url(${heatmapUrl})` }}
                ></div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deepfake Analysis (simple display) */}
      <Card className="mt-6 shadow-card hover:shadow-hover transition-smooth">
        <CardHeader>
          <CardTitle>Deepfake Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {data.real_prob != null && data.fake_prob != null ? (
            <div>
              <p>Prediction: <span className="font-semibold">{data.label}</span></p>
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

      {/* Reverse Search Results */}
      {reverseMatches.length > 0 && (
        <Card className="mt-6 shadow-card hover:shadow-hover transition-smooth">
          <CardHeader>
            <CardTitle>Reverse Image Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {reverseMatches.map((result, index) => (
                <div key={index} className="border border-border rounded-lg p-4 hover:bg-accent/20 transition-smooth">
                  <div className="aspect-video bg-muted rounded mb-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{result.source}</span>
                      {result.similarity && (
                        <Badge variant="outline" className="border-success text-success">
                          {result.similarity}
                        </Badge>
                      )}
                    </div>
                    {result.date && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Posted {result.date}
                      </p>
                    )}
                  </div>
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
