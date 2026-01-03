import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Users, Clock, Calendar, DollarSign, Shield, Zap } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Centralized employee directory with comprehensive profiles and role-based access.',
    },
    {
      icon: Clock,
      title: 'Attendance Tracking',
      description: 'Real-time check-in/out with automated tracking and detailed reports.',
    },
    {
      icon: Calendar,
      title: 'Leave Management',
      description: 'Streamlined leave requests with instant approval workflows.',
    },
    {
      icon: DollarSign,
      title: 'Payroll System',
      description: 'Complete salary management with earnings, deductions, and reports.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure access control for employees and administrators.',
    },
    {
      icon: Zap,
      title: 'Real-Time Updates',
      description: 'Instant notifications and live data synchronization.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold text-xl">D</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-primary-foreground">Dayflow</h1>
                <p className="text-primary-foreground/70 text-xs">HRMS</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="shadow-lg"
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </nav>

          <div className="max-w-3xl">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight animate-fade-in">
              Streamline Your<br />
              <span className="text-accent">HR Operations</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl animate-slide-up">
              Dayflow HRMS is a comprehensive human resource management system that digitizes 
              and streamlines your core HR operations. Manage attendance, leaves, payroll, 
              and employee data all in one powerful platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-slide-up">
              <Button
                size="xl"
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="shadow-xl"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="xl"
                variant="ghost"
                className="text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="font-display text-3xl md:text-4xl font-bold">
              Everything You Need for<br />
              <span className="text-accent">Modern HR Management</span>
            </h3>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete suite of tools designed to simplify your HR processes 
              and empower your workforce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-card rounded-2xl border border-border hover:border-accent/50 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-accent group-hover:text-accent-foreground" />
                </div>
                <h4 className="font-display text-xl font-semibold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-6 text-center">
          <h3 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your HR?
          </h3>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-10">
            Join organizations that have streamlined their HR operations with Dayflow HRMS.
          </p>
          <Button
            size="xl"
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="shadow-xl"
          >
            Start Free Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold">D</span>
              </div>
              <div>
                <h4 className="font-display font-bold">Dayflow HRMS</h4>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 Dayflow HRMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
