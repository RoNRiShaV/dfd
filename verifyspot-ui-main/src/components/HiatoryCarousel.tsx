import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface HistoryItem {
  id: string;
  file_url: string;
  prediction?: string;
  votes_real?: number;
  votes_fake?: number;
}

const backendBase = "http://localhost:8000";

const HistoryCarousel = ({ privacyMode }: { privacyMode: boolean }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (privacyMode) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${backendBase}/api/history`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data); // ✅ backend filters out privacy uploads
        } else {
          console.error("Failed to fetch history:", res.status);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    fetchHistory();
  }, [privacyMode]);

  if (privacyMode) {
    return (
      <p className="text-muted-foreground italic">
        Privacy mode enabled — past uploads are hidden.
      </p>
    );
  }

  if (history.length === 0) {
    return <p className="text-muted-foreground">No past uploads yet.</p>;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">
        Past Uploads & Community Votes
      </h2>
      <div className="history-glass flex space-x-4 overflow-x-auto pb-4">
        {history.map((item) => {
          const total = (item.votes_real ?? 0) + (item.votes_fake ?? 0);
          const realPercent = total > 0 ? (item.votes_real! / total) * 100 : 0;
          const fakePercent = total > 0 ? (item.votes_fake! / total) * 100 : 0;

          return (
            <Card
              key={item.id}
              className="history-card glass-hover min-w-[250px] max-w-[250px] flex-shrink-0 p-4"
            >
              <div className="w-full h-32 overflow-hidden rounded mb-2 glass-card-image">
                <img
                  src={`${backendBase}${item.file_url}`}
                  alt="upload"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-medium mb-1">{item.prediction}</p>
              <p className="text-xs muted-on-dark mb-1">Votes: {total}</p>
              <p className="text-xs">Real: {realPercent.toFixed(1)}%</p>
              <Progress value={realPercent} className="mb-1" />
              <p className="text-xs">Fake: {fakePercent.toFixed(1)}%</p>
              <Progress value={fakePercent} />
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryCarousel;
