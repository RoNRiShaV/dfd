import { AlertTriangle, Github, Mail, FileText } from "lucide-react";

const ForensicsFooter = () => {
  return (
    <footer className="w-full mt-12 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-white/10 text-white backdrop-blur-md shadow-inner">
      <div className="container mx-auto px-6 py-10">
        {/* Disclaimer */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-8 shadow-md backdrop-blur-md">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-200">
              <p className="font-semibold text-yellow-400 mb-1">
                Important Disclaimer
              </p>
              <p>
                This tool provides AI-assisted analysis for educational and
                research purposes. Results are not 100% definitive and should
                not be used as sole evidence for legal or professional
                decisions. Always verify findings with additional sources and
                expert analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid md:grid-cols-4 gap-8 mb-10 text-gray-300">
          <div>
            <h3 className="font-semibold text-white mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Accuracy Reports
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Detection Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Research Papers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Training Data
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Community Forum
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Report Issues
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-pink-400 transition">
                  Data Usage
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-gray-400 text-sm">
            <div className="flex items-center space-x-3">
              <span>© {new Date().getFullYear()} DeepGUARD</span>
              <span>•</span>
              <span>Built for researchers and fact-checkers</span>
            </div>

            <div className="flex items-center space-x-5">
              <a
                href="#"
                className="hover:text-pink-400 transition"
                aria-label="Github"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="hover:text-pink-400 transition"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="hover:text-pink-400 transition"
                aria-label="Docs"
              >
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
