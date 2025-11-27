import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"choice" | "audio" | "video">("choice");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleAudioLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "0000") {
      navigate("/admin/audio");
    } else {
      toast({
        title: "Incorrect password",
        description: "Audio admin password is incorrect",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  const handleVideoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1111") {
      navigate("/admin/video");
    } else {
      toast({
        title: "Incorrect password",
        description: "Video admin password is incorrect",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  const handleBack = () => {
    setMode("choice");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 text-foreground">
          Admin Access
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Select admin type to continue
        </p>

        {mode === "choice" ? (
          <div className="space-y-3">
            <Button
              onClick={() => setMode("audio")}
              variant="outline"
              className="w-full h-12 text-lg"
              data-testid="button-audio-admin"
            >
              Audio Admin
            </Button>
            <Button
              onClick={() => setMode("video")}
              variant="outline"
              className="w-full h-12 text-lg"
              data-testid="button-video-admin"
            >
              Video Admin
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="w-full"
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </div>
        ) : (
          <form
            onSubmit={mode === "audio" ? handleAudioLogin : handleVideoLogin}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "audio" ? "Audio" : "Video"} Admin Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full"
                autoFocus
                data-testid={`input-${mode}-password`}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {mode === "audio"
                  ? "Manage audio training samples"
                  : "Manage video training samples"}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                data-testid={`button-${mode}-login`}
              >
                Login
              </Button>
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="w-full"
                data-testid="button-back-login"
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
