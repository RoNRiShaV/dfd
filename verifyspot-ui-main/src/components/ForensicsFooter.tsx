import { AlertTriangle, Github, Mail, FileText } from "lucide-react";

const ForensicsFooter = () => {
  return (
    <footer className="bg-gradient-card border-t border-border mt-12">
      <div className="container mx-auto px-6 py-8">
        {/* Disclaimer */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-warning mb-1">Important Disclaimer</p>
              <p className="text-muted-foreground">
                This tool provides AI-assisted analysis for educational and research purposes. 
                Results are not 100% definitive and should not be used as sole evidence for legal 
                or professional decisions. Always verify findings with additional sources and expert analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid md:grid-cols-4 gap-8 mb-6">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent-strong transition-smooth">How it Works</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Accuracy Reports</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">API Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Detection Guide</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Research Papers</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Training Data</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Help Center</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Community Forum</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Report Issues</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent-strong transition-smooth">Data Usage</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>© 2024 Social Media Forensics Hub</span>
              <span>•</span>
              <span>Built for researchers and fact-checkers</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-accent-strong transition-smooth">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent-strong transition-smooth">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent-strong transition-smooth">
                <FileText className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ForensicsFooter;