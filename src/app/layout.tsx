import { UserProvider } from '@auth0/nextjs-auth0/client';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MoonRiver Platform - Auth0 AI Agents Challenge',
  description: 'Music education platform demonstrating Auth0 for AI Agents with secure authentication, token vault, and fine-grained authorization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
