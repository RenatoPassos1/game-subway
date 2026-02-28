'use client';

import I18nProvider from '@/components/I18nProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { WalletProvider } from '../contexts/WalletContext';
import { AuthProvider } from '../contexts/AuthContext';
import { AuctionProvider } from '../contexts/AuctionContext';
import { useReferral } from '../hooks/useReferral';

/** Captures ?ref= URL param and stores it in localStorage on any page load. */
function ReferralCapture({ children }: { children: React.ReactNode }) {
  useReferral();
  return <>{children}</>;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <WalletProvider>
        <AuthProvider>
          <AuctionProvider>
            <ReferralCapture>
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </ReferralCapture>
          </AuctionProvider>
        </AuthProvider>
      </WalletProvider>
    </I18nProvider>
  );
}
