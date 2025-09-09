import { Shield, Search } from "lucide-react";

const ForensicsHeader = () => {
  return (
    <header className="border-b border-border bg-gradient-card">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary shadow-glow">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Social Media Forensics Hub
              </h1>
              <p className="text-muted-foreground text-sm">
                Verify viral content instantly
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-strong hover:text-white transition-smooth">
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