import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CommunitySectionProps {
  fileId: string; // ✅ result id passed from Result page
}

const CommunitySection = ({ fileId }: CommunitySectionProps) => {
  const [votes, setVotes] = useState({ real: 0, fake: 0, total: 0 });

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/votes/${fileId}`);
        if (res.ok) {
          const data = await res.json();
          setVotes({
            real: data.votes_real,
            fake: data.votes_fake,
            total: data.total,
          });
        }
      } catch (err) {
        console.error("Error fetching votes:", err);
      }
    };

    if (fileId) fetchVotes();
  }, [fileId]);

  const handleVote = async (vote: "real" | "fake") => {
    try {
      const res = await fetch(`http://localhost:8000/api/vote/${fileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      if (res.ok) {
        const data = await res.json();
        setVotes({
          real: data.votes_real,
          fake: data.votes_fake,
          total: data.total,
        });
      }
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  const realPercentage = votes.total
    ? ((votes.real / votes.total) * 100).toFixed(1)
    : 0;
  const fakePercentage = votes.total
    ? ((votes.fake / votes.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="container mx-auto px-6 py-12">
      <Card className="shadow-card hover:shadow-hover transition-smooth">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-accent-strong" />
            <span>Community Verification</span>
            <Badge
              variant="outline"
              className="ml-auto border-accent-strong text-accent-strong"
            >
              {votes.total.toLocaleString()} votes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voting Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Community Consensus</span>
              <span className="text-muted-foreground">
                {votes.total.toLocaleString()} total votes
              </span>
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
                <div className="w-12 text-sm font-medium text-right">
                  {realPercentage}%
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 text-sm font-medium text-warning">Fake</div>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning transition-all duration-1000 ease-out"
                    style={{ width: `${fakePercentage}%` }}
                  ></div>
                </div>
                <div className="w-12 text-sm font-medium text-right">
                  {fakePercentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Voting Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              className="h-12 bg-success hover:bg-success/90 text-success-foreground transition-smooth"
              onClick={() => handleVote("real")}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Vote Real
            </Button>
            <Button
              className="h-12 bg-warning hover:bg-warning/90 text-warning-foreground transition-smooth"
              onClick={() => handleVote("fake")}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Vote Fake
            </Button>
          </div>

          {/* Optional extra stats */}
          <div className="text-xs text-muted-foreground text-center">
            Community voting helps improve our AI detection accuracy
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunitySection;
