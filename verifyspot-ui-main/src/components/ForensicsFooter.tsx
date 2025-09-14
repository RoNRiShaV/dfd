import { AlertTriangle, Github, Mail, FileText } from "lucide-react";

const ForensicsFooter = () => {
  return (
    <footer className="glass-card border-t border-white/30 mt-12 shadow-lg">
      <div className="container mx-auto px-6 py-8">
        {/* Disclaimer */}
        <div className="glass-card bg-yellow-400/10 border border-yellow-300/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-white/90">
              <p className="font-medium text-yellow-400 mb-1">Important Disclaimer</p>
              <p>
                This tool provides AI-assisted analysis for educational and research
                purposes. Results are not 100% definitive and should not be used as sole
                evidence for legal or professional decisions. Always verify findings
                with additional sources and expert analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid md:grid-cols-4 gap-8 mb-6 text-white/90">
          <div>
            <h3 className="font-semibold text-white mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-pink-400 transition">How it Works</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">Accuracy Reports</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">API Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-pink-400 transition">Detection Guide</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">Research Papers</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">Training Data</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-pink-400 transition">Help Center</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">Community Forum</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">Report Issues</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-pink-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-pink-400 transition">Data Usage</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-white/80">
            <div className="flex items-center space-x-4 text-sm">
              <span>© 2024 Social Media Forensics Hub</span>
              <span>•</span>
              <span>Built for researchers and fact-checkers</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-pink-400 transition"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-pink-400 transition"><Mail className="w-5 h-5" /></a>
              <a href="#" className="hover:text-pink-400 transition"><FileText className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ForensicsFooter;
