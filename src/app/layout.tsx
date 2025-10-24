import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import './globals.css';
import { Poppins } from 'next/font/google';
import { UserProvider } from '../contexts/UserContext';

const poppins = Poppins({ 
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
});

export const metadata = {
  title: 'Moonriver Music - Auth0 AI Agents Challenge',
  description: 'Music education platform demonstrating Auth0 for AI Agents with secure authentication, token vault, and fine-grained authorization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet" />
      </head>
      <body className={poppins.className} style={{ backgroundColor: '#FFFBEB' }}>
        <Auth0Provider>
          <UserProvider>
            {children}
          </UserProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
