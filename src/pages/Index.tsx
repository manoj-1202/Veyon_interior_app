import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PanelsTopLeft, FileText, Users, IndianRupee, Receipt, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: FileText,
      title: 'Detailed product quotations',
      description: 'Capture dimensions, profile, glass, finish, hardware, and installation scope',
    },
    {
      icon: Receipt,
      title: 'Project site records',
      description: 'Keep customer contacts, site addresses, measurement visits, and install dates together',
    },
    {
      icon: Users,
      title: 'Invoices & receipts',
      description: 'Track advances, GST, payment receipts, and the remaining balance',
    },
    {
      icon: IndianRupee,
      title: 'Payment Tracking',
      description: 'Track partial payments and outstanding balances',
    },
  ];

  const services = [
    'uPVC Windows',
    'uPVC Doors',
    'Aluminium Windows',
    'Cupboards',
    'Wardrobes',
    'False Ceilings',
    'Wall Panels',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Logo */}
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary glow-gold">
              <PanelsTopLeft className="h-10 w-10 text-primary-foreground" />
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Veyon Interiors
              <span className="text-gold-gradient"> Project Studio</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Manage customer projects, product quotations, GST invoices, and payments in one place.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="group text-base"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="text-base"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="border-y border-border bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <p className="mb-6 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Products & services
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {services.map((service) => (
              <span
                key={service}
                className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              From site measurement to final payment
            </h2>
            <p className="mt-4 text-muted-foreground">
              Keep every customer project, product specification, quotation, and payment in one clear workspace.
            </p>
          </div>

          <div className="stagger-children mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card hover-lift rounded-xl border border-border p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to streamline your billing?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Keep Veyon Interiors customer projects and billing organized.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="group mt-8 text-base"
          >
            Start Free
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <PanelsTopLeft className="h-5 w-5 text-primary" />
            <span className="font-semibold">Veyon Interiors Project Studio</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Quotations, invoices, and payment tracking
          </p>
        </div>
      </footer>
    </div>
  );
}
