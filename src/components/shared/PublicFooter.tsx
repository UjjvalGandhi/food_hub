import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function PublicFooter() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          
          {/* Brand & Mission (Spans 2 cols on XL) */}
          <div className="xl:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tight text-primary">🍽️ FoodPartner</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Connecting food lovers with the best local restaurants. Fast delivery, fresh food, and endless choices delivered right to your door.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4 items-center pt-2">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Company</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="transition-colors hover:text-primary">About Us</Link>
              </li>
              <li>
                <Link href="/careers" className="transition-colors hover:text-primary">Careers</Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-primary">Blog</Link>
              </li>
              <li>
                <Link href="/press" className="transition-colors hover:text-primary">Press</Link>
              </li>
            </ul>
          </div>

          {/* For Restaurants Links */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">For Restaurants</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="/register?role=PROVIDER" className="transition-colors hover:text-primary">Partner with us</Link>
              </li>
              <li>
                <Link href="/provider-app" className="transition-colors hover:text-primary">Restaurant App</Link>
              </li>
              <li>
                <Link href="/success-stories" className="transition-colors hover:text-primary">Success Stories</Link>
              </li>
              <li>
                <Link href="/delivery/register" className="transition-colors hover:text-primary">Deliver with us</Link>
              </li>
              <li>
                <Link href="/api-docs" className="transition-colors hover:text-primary">API Integrations</Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Support</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="transition-colors hover:text-primary">Help Center</Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-primary">Contact Us</Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-primary">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-muted/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left" suppressHydrationWarning>
            &copy; {CURRENT_YEAR} FoodPartner Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
