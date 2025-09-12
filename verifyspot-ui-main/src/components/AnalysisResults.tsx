import { Camera, Calendar, MapPin, AlertTriangle, Eye, EyeOff, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const AnalysisResults = ({ data }: { data?: any }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No analysis data available.
      </div>
    );
  }

  const tamperScore = data.tamper_score ?? 0;

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
              {data.exif && Object.entries(data.exif).length > 0 ? (
                Object.entries(data.exif).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}</span>
                    <span className="text-sm font-medium">{String(value)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No EXIF metadata found.</p>
              )}
            </div>
            {data.phash && (
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground flex items-center">
                  <Hash className="w-3 h-3 mr-1" /> pHash
                </span>
                <span className="text-sm font-medium">{data.phash}</span>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <Badge variant="outline" className="border-success text-success">
                <MapPin className="w-3 h-3 mr-1" />
                {data.exif && Object.keys(data.exif).length > 0
                  ? "Metadata Extracted"
                  : "No Metadata"}
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
                <span className="text-3xl font-bold text-warning">{tamperScore}%</span>
                <span className="text-xs text-muted-foreground">
                  {tamperScore > 70 ? "Suspicious" : "Likely Genuine"}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="border-accent-strong text-accent-strong hover:bg-accent"
              >
                {showHeatmap ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showHeatmap ? "Hide" : "Show"} Heatmap
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={data.image_url} 
                alt="Uploaded content"
                className="w-full h-48 object-cover"
              />
              {showHeatmap && data.heatmap_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-multiply"
                  style={{ backgroundImage: `url(${data.heatmap_url})` }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deepfake Analysis */}
      <Card className="mt-6 shadow-card hover:shadow-hover transition-smooth">
        <CardHeader>
          <CardTitle>Deepfake Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {data.real_prob != null && data.fake_prob != null ? (
            <div>
              <p>
                Prediction:{" "}
                <span className="font-semibold capitalize">{data.prediction}</span>
              </p>
              <p className="text-sm mt-2">
                Real Probability: {(data.real_prob * 100).toFixed(2)}%
              </p>
              <Progress value={data.real_prob * 100} className="mb-2" />
              <p className="text-sm">
                Fake Probability: {(data.fake_prob * 100).toFixed(2)}%
              </p>
              <Progress value={data.fake_prob * 100} />
            </div>
          ) : (
            <p className="text-muted-foreground">Deepfake analysis not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Reverse Search Results */}
      <Card className="mt-6 shadow-card hover:shadow-hover transition-smooth">
        <CardHeader>
          <CardTitle>Reverse Image Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          {data.reverse_matches && data.reverse_matches.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {data.reverse_matches.map((result: any, index: number) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 hover:bg-accent/20 transition-smooth"
                >
                  <div className="aspect-video bg-muted rounded mb-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{result.source ?? "Unknown"}</span>
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
          ) : (
            <p className="text-muted-foreground">No reverse matches found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;
