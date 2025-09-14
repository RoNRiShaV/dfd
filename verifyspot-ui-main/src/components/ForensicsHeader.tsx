import { Shield, Search } from "lucide-react";

const ForensicsHeader = () => {
  return (
    <header className="glass-card border-b border-white/30 shadow-lg">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow">
                DeepGUARD
              </h1>
              <p className="text-white/70 text-sm">
                Verify viral content instantly
              </p>
            </div>
          </div>

          {/* Browse Button */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/40 transition-all">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Database</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ForensicsHeader;
