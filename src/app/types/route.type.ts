
export const methods = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options'
];

export const statusCodes = [
  { code: 100, text: 'Continue' },
  { code: 101, text: 'Switching Protocols' },
  { code: 102, text: 'Processing' },
  { code: 200, text: 'OK' },
  { code: 201, text: 'Created' },
  { code: 202, text: 'Accepted' },
  { code: 203, text: 'Non-Authoritative Information' },
  { code: 204, text: 'No Content' },
  { code: 205, text: 'Reset Content' },
  { code: 206, text: 'Partial Content' },
  { code: 207, text: 'Multi-Status' },
  { code: 208, text: 'Already Reported' },
  { code: 226, text: 'IM Used' },
  { code: 300, text: 'Multiple Choices' },
  { code: 301, text: 'Moved Permanently' },
  { code: 302, text: 'Found' },
  { code: 303, text: 'See Other' },
  { code: 304, text: 'Not Modified' },
  { code: 305, text: 'Use Proxy' },
  { code: 306, text: '(Unused)' },
  { code: 307, text: 'Temporary Redirect' },
  { code: 308, text: 'Permanent Redirect' },
  { code: 400, text: 'Bad Request' },
  { code: 401, text: 'Unauthorized' },
  { code: 402, text: 'Payment Required' },
  { code: 403, text: 'Forbidden' },
  { code: 404, text: 'Not Found' },
  { code: 405, text: 'Method Not Allowed' },
  { code: 406, text: 'Not Acceptable' },
  { code: 407, text: 'Proxy Authentication Required' },
  { code: 408, text: 'Request Timeout' },
  { code: 409, text: 'Conflict' },
  { code: 410, text: 'Gone' },
  { code: 411, text: 'Length Required' },
  { code: 412, text: 'Precondition Failed' },
  { code: 413, text: 'Payload Too Large' },
  { code: 414, text: 'URI Too Long' },
  { code: 415, text: 'Unsupported Media Type' },
  { code: 416, text: 'Range Not Satisfiable' },
  { code: 417, text: 'Expectation Failed' },
  { code: 421, text: 'Misdirected Request' },
  { code: 422, text: 'Unprocessable Entity' },
  { code: 423, text: 'Locked' },
  { code: 424, text: 'Failed Dependency' },
  { code: 426, text: 'Upgrade Required' },
  { code: 428, text: 'Precondition Required' },
  { code: 429, text: 'Too Many Requests' },
  { code: 431, text: 'Request Header Fields Too Large' },
  { code: 451, text: 'Unavailable For Legal Reasons' },
  { code: 500, text: 'Internal Server Error' },
  { code: 501, text: 'Not Implemented' },
  { code: 502, text: 'Bad Gateway' },
  { code: 503, text: 'Service Unavailable' },
  { code: 504, text: 'Gateway Timeout' },
  { code: 505, text: 'HTTP Version Not Supported' },
  { code: 506, text: 'Variant Also Negotiates' },
  { code: 507, text: 'Insufficient Storage' },
  { code: 508, text: 'Loop Detected' },
  { code: 510, text: 'Not Extended' },
  { code: 511, text: 'Network Authentication Required}' }
];

export const headerNames = [
  'Accept',
  'Accept-CH',
  'Accept-Charset',
  'Accept-Features',
  'Accept-Encoding',
  'Accept-Language',
  'Accept-Ranges',
  'Access-Control-Allow-Credentials',
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Headers',
  'Access-Control-Max-Age',
  'Access-Control-Expose-Headers',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  'Age',
  'Allow',
  'Alternates',
  'Authorization',
  'Cache-Control',
  'Connection',
  'Content-Encoding',
  'Content-Language',
  'Content-Length',
  'Content-Location',
  'Content-MD5',
  'Content-Range',
  'Content-Security-Policy',
  'Content-Type',
  'Cookie',
  'DNT',
  'Date',
  'ETag',
  'Expect',
  'Expires',
  'From',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Last-Event-ID',
  'Last-Modified',
  'Link',
  'Location',
  'Max-Forwards',
  'Negotiate',
  'Origin',
  'Pragma',
  'Proxy-Authenticate',
  'Proxy-Authorization',
  'Range',
  'Referer',
  'Retry-After',
  'Sec-Websocket-Extensions',
  'Sec-Websocket-Key',
  'Sec-Websocket-Origin',
  'Sec-Websocket-Protocol',
  'Sec-Websocket-Version',
  'Server',
  'Set-Cookie',
  'Set-Cookie2',
  'Strict-Transport-Security',
  'TCN',
  'TE',
  'Trailer',
  'Transfer-Encoding',
  'Upgrade',
  'User-Agent',
  'Variant-Vary',
  'Vary',
  'Via',
  'Warning',
  'WWW-Authenticate',
  'X-Content-Duration',
  'X-Content-Security-Policy',
  'X-DNSPrefetch-Control',
  'X-Frame-Options',
  'X-Requested-With'
];

export const mimeTypesWithTemplating = [
  'application/json',
  'text/html',
  'text/css',
  'text/csv',
  'application/javascript',
  'application/typescript',
  'text/plain',
  'application/xhtml+xml',
  'application/xml'
];

// values used to suggest
export const headerValues = [
  // content types
  'text/plain',
  'text/html',
  'application/json',
  'application/xml',
  'multipart/form-data',
  'application/xhtml+xml',
  'application/x-www-form-urlencoded',
  'text/csv',
  'text/css',
  'application/javascript',
  'application/zip',
  'application/pdf',
  'application/sql',
  'application/graphql',
  'application/ld+json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'audio/mpeg',
  'audio/vorbis',
  'image/png',
  'image/jpeg',
  'image/gif',

  // authorization
  'Basic ',
  'Bearer ',
  'Digest ',
  'HOBA ',
  'Mutual ',
  'AWS4-HMAC-SHA256 ',

  // cache control
  'max-age=',
  'max-stale=',
  'min-fresh=',
  'no-cache',
  'no-store',
  'no-transform',
  'only-if-cached',
  'must-revalidate',
  'no-cache',
  'no-store',
  'no-transform',
  'public',
  'private',
  'proxy-revalidate',
  's-maxage=',

  // charset
  'US-ASCII',
  'ISO-8859-1',
  'UTF-8',
  'UTF-16BE',
  'UTF-16LE',
  'UTF-16'
];

export type RouteResponse = {
  uuid: string;
  rules: ResponseRule[];
  statusCode: string;
  headers: Header[];
  body?: string;
  latency: number;
  filePath: string;
  sendFileAsBody: boolean;
};

export type ResponseRule = {
  target: ResponseRuleTargets;
  modifier: string;
  value: string;
  isRegex: boolean;
};

export type ResponseRuleTargets = 'body' | 'query' | 'header' | 'params';

export type Route = {
  uuid: string;
  documentation: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';
  endpoint: string;
  params: ParamRequest[];
  responses: RouteResponse[];
};

export type Header = { key: string, value: string };

export type ParamRequest = {key: string, value: string};

export const CORSHeaders: Header[] = [
  { key: 'Access-Control-Allow-Origin', value: '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With' }
];

export type RouteProperties = { [T in keyof Route]?: Route[T] };

export type RouteResponseProperties = { [T in keyof RouteResponse]?: RouteResponse[T] };
