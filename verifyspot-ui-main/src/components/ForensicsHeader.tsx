import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const ForensicsHeader = () => {
  return (
    <header className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-white/10 shadow-lg backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo / Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">DeepGUARD</h1>
            <p className="text-xs text-gray-400">
              Verify viral content instantly
            </p>
          </div>
        </div>

        {/* Right-side action */}
        <Button
          variant="outline"
          className="border border-pink-500/40 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition backdrop-blur-sm"
        >
          Browse Database
        </Button>
      </div>
    </header>
  );
};

export default ForensicsHeader;
