import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AdminLogin from "@/pages/auth/admin-login";
import ConsumerLogin from "@/pages/auth/consumer-login";
import AdminMenu from "@/pages/admin/menu";
import AdminTransactions from "@/pages/admin/transactions";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminPromo from "@/pages/admin/promo";
import AdminDashboard from "@/pages/admin/dashboard";
import ConsumerDashboard from "@/pages/consumer/dashboard";
import ConsumerFavorites from "@/pages/consumer/favorites";
import ConsumerProfile from "@/pages/consumer/profile";

import AuthOptions from "@/pages/auth-options";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth-options" component={AuthOptions} />
      
      {/* Auth Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/consumer/login" component={ConsumerLogin} />
      
      {/* Dashboard Routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/menu" component={AdminMenu} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/promo" component={AdminPromo} />
      
      <Route path="/consumer/dashboard" component={ConsumerDashboard} />
      <Route path="/consumer/favorites" component={ConsumerFavorites} />
      <Route path="/consumer/profile" component={ConsumerProfile} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
