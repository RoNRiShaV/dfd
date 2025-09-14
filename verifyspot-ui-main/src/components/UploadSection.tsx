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
      formData.append("file", file);

      // ✅ use env variable instead of hardcoded localhost
      const API = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${text}`);
      }

      const result = await response.json();
      console.log("Analysis result:", result);

      const idToNavigate = result.id || result.filename;
      if (!idToNavigate) {
        console.warn("Upload returned no id/filename — staying on page.");
        return;
      }
      navigate(`/results/${idToNavigate}`);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-4">
            Upload Content for Analysis
          </h2>
          <p className="text-gray-200">
            Upload an image or video, or paste a social media link to verify its
            authenticity
          </p>
        </div>

        <Card
          className={`relative p-8 border-2 border-dashed rounded-2xl 
            bg-white/10 backdrop-blur-lg shadow-xl transition 
            ${dragActive ? "border-pink-400 bg-white/20" : "border-white/20"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-md">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium text-white drop-shadow">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-300">
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
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-pink-500/50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-4 h-4 mr-2" />
                Choose File
              </Button>

              <Button
                variant="outline"
                className="border border-pink-400/60 text-pink-300 hover:bg-pink-500/20 hover:text-pink-200 transition"
              >
                <Link className="w-4 h-4 mr-2" />
                Paste Link
              </Button>
            </div>

            <div className="pt-4 border-t border-white/20">
              <p className="text-xs text-gray-300">
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
