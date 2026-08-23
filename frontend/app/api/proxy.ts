// app/api/proxy/route.js
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8682"; 

const MAX_BODY_BYTES = parseInt(process.env.PROXY_MAX_BODY_BYTES || '26214400', 10);
const MAX_UPLOAD_FILES = 50;
const BLOCKED_UPLOAD_EXT = /\.(exe|bat|cmd|com|scr|msi|dll|ps1|vbs|jar|sh)(?:$|[?#])/i;

function validateUpstream(url: URL): string | null {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Unsupported upstream protocol';
  }
  const decoded = decodeURIComponent(url.pathname);
  if (decoded.includes('..') || decoded.includes('\0') || decoded.includes('\\')) {
    return 'Invalid request path';
  }
  return null;
}

export async function proxyRequest(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const path = pathname?.replace(/^\/api\b/, '/v1');

  // 3. Build the final upstream URL
  const upstreamUrl = new URL(path, BACKEND_URL);
  // 4. Copy all original search params (except maybe 'path')
  for (const [key, value] of searchParams.entries()) {
    upstreamUrl.searchParams.append(key, value);
  }

  const upstreamError = validateUpstream(upstreamUrl);
  if (upstreamError) {
    return NextResponse.json({ error: upstreamError }, { status: 400 });
  }

  const declaredLength = parseInt(
    request.headers.get('content-length') || '0',
    10,
  );
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  const method = request.method;
  let headers = new Headers(request.headers);
  
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('cookie');

  let body;
  const contentType = headers.get('content-type');

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') {
    body = undefined;
  } else {
    
    
    if (contentType && contentType.includes('multipart/form-data')) {
        
        const formData = await request.formData();

        // 2. Create a new FormData to send to external API
        const externalFormData = new FormData();
        let fileCount = 0;
        let totalUploadBytes = 0;

        // 3. Copy all fields from incoming formData
        for (const [key, value] of formData.entries()) {
          if ( value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && typeof value.type === 'string' && typeof value.name === 'string' ) {
            fileCount += 1;
            if (fileCount > MAX_UPLOAD_FILES) {
              return NextResponse.json(
                { error: 'Too many uploaded files' },
                { status: 413 },
              );
            }
            if (BLOCKED_UPLOAD_EXT.test(value.name)) {
              return NextResponse.json(
                { error: 'File type not allowed', file: value.name },
                { status: 415 },
              );
            }
            const buf = await value.arrayBuffer();
            totalUploadBytes += buf.byteLength;
            if (totalUploadBytes > MAX_BODY_BYTES) {
              return NextResponse.json(
                { error: 'Uploaded payload too large' },
                { status: 413 },
              );
            }
            // Reconstruct File as Blob (Files survive .entries() in Node.js)
            const blob = new Blob([buf], { type: value.type });
            externalFormData.append(key, blob, value.name);
          } else {
            if (typeof value === 'string' && value.length > 1_000_000) {
              return NextResponse.json(
                { error: 'Form field too large' },
                { status: 413 },
              );
            }
            externalFormData.append(key, value);
          }
        }
        body = externalFormData;
        
        const tenantId = request.headers.get('X-TENANT-ID');
        headers = new Headers();
        if (tenantId) {
          headers.set('X-TENANT-ID', tenantId);
        }
    } else {
      
      const text = await request.text();
      body = text;
      
      if (contentType && contentType.includes('application/json') && text) {
        try {
          JSON.parse(text); 
        } catch (e) {
          return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }
      }
    }
  }

  
  
  const defaultTimeoutMs = parseInt(process.env.PROXY_TIMEOUT_MS || '60000', 10); 
  const streamingTimeoutMs = parseInt(process.env.PROXY_STREAMING_TIMEOUT_MS || '300000', 10); 
  
  
  
  
  
  const isPotentialStreamingPath = pathname.includes('/threads/') ||
                                    pathname.includes('/chat/completions') ||
                                    pathname.includes('/chat');
  
  
  const initialTimeoutMs = isPotentialStreamingPath ? streamingTimeoutMs : defaultTimeoutMs;
  
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    
    timeoutId = setTimeout(() => controller.abort(), initialTimeoutMs);

    const res = await fetch(upstreamUrl.toString(), {
      method,
      headers,
      body,
      signal: controller.signal,
      
      keepalive: true,
    });

    
    const contentType = res.headers.get('content-type') || '';
    const isStreaming = contentType.includes('text/event-stream') || 
                        contentType.includes('stream') ||
                        res.headers.get('transfer-encoding') === 'chunked';

    if (isStreaming && res.body) {
      
      if (timeoutId) clearTimeout(timeoutId);
      
      
      
      
      
      const streamHeaders = new Headers(res.headers);
      streamHeaders.delete('server');
      streamHeaders.delete('x-powered-by');
      return new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: streamHeaders,
      });
    }

    
    if (timeoutId) clearTimeout(timeoutId);

    
    if (!res.ok && !res.body) {
      return NextResponse.json(
        { 
          error: 'Proxy request failed', 
          message: `Backend returned status ${res.status} without body`,
        }, 
        { status: res.status }
      );
    }

    
    const responseData = await res.blob(); 
    const responseHeaders = new Headers(res.headers);
    responseHeaders.set('content-length', responseData.size.toString());
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('server');
    responseHeaders.delete('x-powered-by');

    return new NextResponse(responseData, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    
    
    console.error("Proxy request failed: ", {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: error.cause,
      stack: error.stack
    });
    
    
    if (error.cause?.code === 'UND_ERR_SOCKET' || 
        error.message?.includes('other side closed') ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND')) {
      return NextResponse.json(
        { 
          error: 'Proxy connection closed', 
          message: 'Backend connection was closed unexpectedly. This may happen if the request takes too long or the backend service restarted.',
          code: error.cause?.code || 'CONNECTION_CLOSED'
        }, 
        { status: 502 } 
      );
    }
    
    
    if (error.name === 'AbortError' || 
        error.code === 'UND_ERR_HEADERS_TIMEOUT' ||
        error.code === 20 || // DOMException.ABORT_ERR
        error.message?.includes('aborted') ||
        error.message?.includes('This operation was aborted')) {
      return NextResponse.json(
        { 
          error: 'Proxy request timeout', 
          message: `Request exceeded timeout of ${initialTimeoutMs}ms. ${isPotentialStreamingPath ? 'This is a streaming endpoint, which may take longer to respond.' : 'Please try again or contact support if the issue persists.'}`,
          details: error.message,
          code: 'TIMEOUT'
        }, 
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        code: error.code || 'UNKNOWN_ERROR'
      }, 
      { status: 500 }
    );
  }
}