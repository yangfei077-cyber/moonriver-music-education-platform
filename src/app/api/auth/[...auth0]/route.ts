import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'login';
  
  if (action === 'login') {
    // Mock login redirect for demo
    return NextResponse.redirect('http://localhost:3000?loggedIn=true');
  }
  
  if (action === 'logout') {
    // Mock logout redirect for demo
    return NextResponse.redirect('http://localhost:3000');
  }
  
  return NextResponse.json({ message: 'Auth endpoint' });
}