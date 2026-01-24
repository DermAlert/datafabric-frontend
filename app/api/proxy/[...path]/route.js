/**
 * API Proxy Route
 * Proxies requests to the backend to avoid CORS issues
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004';

export async function GET(request, { params }) {
  return proxyRequest(request, await params, 'GET');
}

export async function POST(request, { params }) {
  return proxyRequest(request, await params, 'POST');
}

export async function PUT(request, { params }) {
  return proxyRequest(request, await params, 'PUT');
}

export async function PATCH(request, { params }) {
  return proxyRequest(request, await params, 'PATCH');
}

export async function DELETE(request, { params }) {
  return proxyRequest(request, await params, 'DELETE');
}

async function proxyRequest(request, params, method) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/api/${path}`;
  
  // Get search params
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${url}?${searchParams}` : url;

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Forward authorization header if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const fetchOptions = {
      method,
      headers,
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(fullUrl, fetchOptions);
    
    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: String(error) },
      { status: 502 }
    );
  }
}
