import { Upload, Link, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

const UploadSection = () => {
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image_file", file);

      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Analysis result:", result);

      // ✅ Navigate to /results/:id with result.id
      navigate(`/results/${result.id}`);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Upload Content for Analysis
          </h2>
          <p className="text-muted-foreground">
            Upload an image or video, or paste a social media link to verify its authenticity
          </p>
        </div>

        <Card
          className={`p-8 border-2 border-dashed transition-smooth shadow-card hover:shadow-hover ${
            dragActive ? "border-primary bg-accent/20" : "border-border"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center">
                <Upload className="w-8 h-8 text-accent-strong" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-muted-foreground">
                Supports JPG, PNG, MP4, MOV files up to 50MB
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              <Button
                className="bg-gradient-primary hover:shadow-glow transition-smooth"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-4 h-4 mr-2" />
                Choose File
              </Button>

              <Button
                variant="outline"
                className="border-accent-strong text-accent-strong hover:bg-accent"
              >
                <Link className="w-4 h-4 mr-2" />
                Paste Link
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Your uploads are processed securely and deleted after analysis
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadSection;
