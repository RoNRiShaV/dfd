import { ThumbsUp, ThumbsDown, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CommunitySection = () => {
  const fakePercentage = 32;
  const realPercentage = 68;
  const totalVotes = 1547;

  return (
    <div className="container mx-auto px-6 py-12">
      <Card className="shadow-card hover:shadow-hover transition-smooth">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-accent-strong" />
            <span>Community Verification</span>
            <Badge variant="outline" className="ml-auto border-accent-strong text-accent-strong">
              {totalVotes.toLocaleString()} votes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voting Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Community Consensus</span>
              <span className="text-muted-foreground">{totalVotes.toLocaleString()} total votes</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 text-sm font-medium text-success">Real</div>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success transition-all duration-1000 ease-out"
                    style={{ width: `${realPercentage}%` }}
                  ></div>
                </div>
                <div className="w-12 text-sm font-medium text-right">{realPercentage}%</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 text-sm font-medium text-warning">Fake</div>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-warning transition-all duration-1000 ease-out"
                    style={{ width: `${fakePercentage}%` }}
                  ></div>
                </div>
                <div className="w-12 text-sm font-medium text-right">{fakePercentage}%</div>
              </div>
            </div>
          </div>

          {/* Voting Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="h-12 bg-success hover:bg-success/90 text-success-foreground transition-smooth"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Vote Real
            </Button>
            <Button 
              className="h-12 bg-warning hover:bg-warning/90 text-warning-foreground transition-smooth"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Vote Fake
            </Button>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </div>
              <p className="text-lg font-semibold text-foreground mt-1">#247</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Expert Votes</p>
              <p className="text-lg font-semibold text-foreground mt-1">23</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-lg font-semibold text-accent-strong mt-1">High</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Community voting helps improve our AI detection accuracy
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunitySection;