const { DynamoDBClient, ScanCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto');

const dynamo = new DynamoDBClient({ region: 'us-east-1' });

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5ksvMevzv5l/HSqmigbB
pqgeuR1AYz6/u6nQck2ArIizjwqwEV+aJJmv2wz7i/feP3TvWdouv/LQfsf/WCVQ
zifiOTRg479GHwdxGGl6D+myGi8OxSQg7oSlHS04yHGTLXqE5BF7P6nQvYKqAHet
qi67hW0N9ysdi3ujxhheyhsk/HTlFcP33l+Leng+G7hRH3WN8MGzbkj5uu/spE4O
WU67AT/x/09d8L6OUeXPnigXTi491wovMlE51JtA61WdiyGhcm8sphUivgmGe/bh
23F4kyKb/HUVueYcbQVQYkaG7shATJaLl4dVd/LpJZBS6HGGH/7MBW1Bi5f/im1+
GQIDAQAB
-----END PUBLIC KEY-----`;

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const path = request.uri;

  // Serve landing page for browser GET requests to root
  if (request.method === 'GET' && (request.uri === '/' || request.uri === '')) {
    return request; // pass through to CloudFront origin (index.html)
  }

  let body;
  try {
    const raw = Buffer.from(request.body.data, 'base64').toString('utf8');
    body = JSON.parse(raw);
  } catch (e) {
    return errorResponse(-32700, 'Parse error');
  }

  let isAuthenticated = false;
  const authHeader = (request.headers['authorization'] || [{}])[0]?.value;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      isAuthenticated = verifyJWT(token, PUBLIC_KEY);
    } catch (e) {
      return { status: '401', body: 'Unauthorised' };
    }
  }

  if (path.startsWith('/registry') || path === '/') {
    return handleRegistry(body, isAuthenticated);
  }
  if (path.startsWith('/articles')) {
    return handleArticles(body);
  }
  if (path.startsWith('/locations')) {
    return handleLocations(body);
  }
  if (path.startsWith('/documents')) {
    if (!isAuthenticated) return { status: '401', body: 'Unauthorised' };
    return handleDocuments(body);
  }

  return errorResponse(-32601, 'Not found');
};

async function handleRegistry(body, isAuth) {
  if (body.method === 'tools/list') {
    return mcpResponse({
      tools: [
        {
          name: 'discover_servers',
          description: 'Returns all MCP servers available to this client, filtered by authentication status.',
          inputSchema: { type: 'object', properties: { capability_filter: { type: 'string' } } }
        },
        {
          name: 'get_server_details',
          description: 'Returns full connection details for a specific server.',
          inputSchema: { type: 'object', properties: { server_id: { type: 'string' } }, required: ['server_id'] }
        }
      ]
    });
  }

  if (body.method === 'tools/call') {
    const tool = body.params?.name;
    const args = body.params?.arguments || {};

    if (tool === 'discover_servers') {
      const result = await dynamo.send(new ScanCommand({ TableName: 'mcp-registry' }));
      const servers = result.Items
        .map(unmarshall)
        .filter(s => s.public || isAuth);
      if (args.capability_filter) {
        servers = servers.filter(s => (s.capabilities || []).includes(args.capability_filter));
      }
      return mcpResponse({ servers });
    }

    if (tool === 'get_server_details' && args.server_id) {
      const result = await dynamo.send(new GetItemCommand({
        TableName: 'mcp-registry',
        Key: { server_id: { S: args.server_id } }
      }));
      if (!result.Item) return errorResponse(-32602, 'Not found');
      const item = unmarshall(result.Item);
      if (!item.public && !isAuth) return errorResponse(-32602, 'Unauthorised');
      return mcpResponse(item);
    }
  }

  return errorResponse(-32601, 'Method not found');
}

async function handleArticles(body) {
  if (body.method === 'tools/list') {
    return mcpResponse({
      tools: [
        {
          name: 'list_articles',
          description: 'Returns all published articles with title, publication date, URL, tags, and estimated read time.',
          inputSchema: {
            type: 'object',
            properties: {
              tag: { type: 'string', description: 'Filter by tag.' },
              after: { type: 'string', description: 'ISO date. Return articles published after this date.' },
              before: { type: 'string', description: 'ISO date. Return articles published before this date.' }
            }
          }
        },
        {
          name: 'get_article_summary',
          description: 'Returns the summary and key themes for a specific article.',
          inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] }
        }
      ]
    });
  }

  if (body.method === 'tools/call') {
    const tool = body.params?.name;
    const args = body.params?.arguments || {};

    if (tool === 'list_articles') {
      const result = await dynamo.send(new ScanCommand({ TableName: 'mcp-articles' }));
      let articles = result.Items.map(unmarshall);
      if (args.tag) articles = articles.filter(a => (a.tags || []).includes(args.tag));
      if (args.after) articles = articles.filter(a => a.published >= args.after);
      if (args.before) articles = articles.filter(a => a.published <= args.before);
      return mcpResponse({ articles });
    }

    if (tool === 'get_article_summary' && args.slug) {
      const result = await dynamo.send(new GetItemCommand({
        TableName: 'mcp-articles',
        Key: { article_id: { S: args.slug } }
      }));
      if (!result.Item) return errorResponse(-32602, 'Not found');
      return mcpResponse(unmarshall(result.Item));
    }
  }

  return errorResponse(-32601, 'Method not found');
}

async function handleLocations(body) {
  if (body.method === 'tools/list') {
    return mcpResponse({
      tools: [
        {
          name: 'list_locations',
          description: 'Returns all locations with city, country, arrival date, and departure date.',
          inputSchema: {
            type: 'object',
            properties: {
              country: { type: 'string' },
              after: { type: 'string', description: 'ISO date.' },
              before: { type: 'string', description: 'ISO date.' }
            }
          }
        },
        {
          name: 'get_location_detail',
          description: 'Returns full detail for a specific city visit.',
          inputSchema: { type: 'object', properties: { location_id: { type: 'string' } }, required: ['location_id'] }
        }
      ]
    });
  }

  if (body.method === 'tools/call') {
    const tool = body.params?.name;
    const args = body.params?.arguments || {};

    if (tool === 'list_locations') {
      const result = await dynamo.send(new ScanCommand({ TableName: 'mcp-locations' }));
      let locations = result.Items.map(unmarshall);
      if (args.country) locations = locations.filter(l => l.country === args.country);
      if (args.after) locations = locations.filter(l => l.arrival >= args.after);
      if (args.before) locations = locations.filter(l => l.departure <= args.before);
      return mcpResponse({ locations });
    }

    if (tool === 'get_location_detail' && args.location_id) {
      const result = await dynamo.send(new GetItemCommand({
        TableName: 'mcp-locations',
        Key: { location_id: { S: args.location_id } }
      }));
      if (!result.Item) return errorResponse(-32602, 'Not found');
      return mcpResponse(unmarshall(result.Item));
    }
  }

  return errorResponse(-32601, 'Method not found');
}

async function handleDocuments(body) {
  if (body.method === 'tools/list') {
    return mcpResponse({
      tools: [
        {
          name: 'list_documents',
          description: 'Returns a catalogue of available documents. Requires valid bearer token.',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'get_document_metadata',
          description: 'Returns full metadata for a specific document. Requires valid bearer token.',
          inputSchema: { type: 'object', properties: { doc_id: { type: 'string' } }, required: ['doc_id'] }
        }
      ]
    });
  }

  if (body.method === 'tools/call') {
    const tool = body.params?.name;
    const args = body.params?.arguments || {};

    if (tool === 'list_documents') {
      const result = await dynamo.send(new ScanCommand({ TableName: 'mcp-documents' }));
      return mcpResponse({ documents: result.Items.map(unmarshall) });
    }

    if (tool === 'get_document_metadata' && args.doc_id) {
      const result = await dynamo.send(new GetItemCommand({
        TableName: 'mcp-documents',
        Key: { doc_id: { S: args.doc_id } }
      }));
      if (!result.Item) return errorResponse(-32602, 'Not found');
      return mcpResponse(unmarshall(result.Item));
    }
  }

  return errorResponse(-32601, 'Method not found');
}

function verifyJWT(token, publicKey) {
  const [h, p, sig] = token.split('.');
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(h + '.' + p);
  if (!verify.verify(publicKey, sig, 'base64url')) throw new Error('Invalid');
  return JSON.parse(Buffer.from(p, 'base64url').toString());
}

function mcpResponse(data) {
  return {
    status: '200',
    headers: { 'content-type': [{ value: 'application/json' }] },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: { content: [{ type: 'text', text: JSON.stringify(data) }] }
    })
  };
}

function errorResponse(code, msg) {
  return {
    status: '400',
    body: JSON.stringify({ jsonrpc: '2.0', error: { code, message: msg } })
  };
}