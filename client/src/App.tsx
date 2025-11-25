import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SecretIcon() {
  const [clickCount, setClickCount] = useState(0);
  const [, navigate] = useLocation();

  const handleDoubleClick = () => {
    setClickCount(0);
    navigate("/admin");
  };

  return (
    <button
      onClick={() => {
        setClickCount(prev => prev + 1);
        setTimeout(() => setClickCount(0), 500);
        if (clickCount === 0) handleDoubleClick();
      }}
      className="fixed top-4 right-4 p-2 hover-elevate opacity-30 hover:opacity-100 transition-opacity z-50"
      data-testid="button-secret-icon"
      title="Double-click for admin"
    >
      <Lock className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SecretIcon />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
