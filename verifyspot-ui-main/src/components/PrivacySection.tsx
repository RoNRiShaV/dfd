import { Shield, Lock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const PrivacySection = () => {
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <div className="container mx-auto px-6 py-8">
      <Card className="max-w-2xl mx-auto shadow-card hover:shadow-hover transition-smooth">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-accent-strong" />
            <span>Privacy Controls</span>
            {privacyMode && (
              <Badge variant="outline" className="border-success text-success ml-auto">
                <Lock className="w-3 h-3 mr-1" />
                Protected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-accent">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent-strong/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-accent-strong" />
              </div>
              <div>
                <p className="font-medium text-accent-strong">Privacy Mode</p>
                <p className="text-sm text-accent-foreground">
                  Hide your analysis from public searches
                </p>
              </div>
            </div>
            <Switch 
              checked={privacyMode}
              onCheckedChange={setPrivacyMode}
              className="data-[state=checked]:bg-success"
            />
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-success mt-1.5"></div>
              <p>Your uploads are automatically deleted after 24 hours</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-success mt-1.5"></div>
              <p>Analysis metadata is anonymized and encrypted</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-success mt-1.5"></div>
              <p>Community voting data cannot be traced back to users</p>
            </div>
            {privacyMode && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-accent-strong mt-1.5"></div>
                <p className="text-accent-strong font-medium">
                  Privacy mode enabled: Results hidden from public database
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacySection;