import { file, serve } from 'bun'
import { readdirSync, writeFileSync } from 'node:fs'

const store = new Map()

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

const parsePath = (path: string) => {
  const parts = path.split('/')
  parts.shift()
  const resourceName = parts[0]
  const id = parts[1]
  return { resourceName, id }
}

const saveJsonFile = (resourceName: string, data: any[]) => {
  try {
    const filePath = `./fake-server/${resourceName}.json`
    writeFileSync(filePath, JSON.stringify(data, null, 2))
    console.log(`Saved ${data.length} items to ${resourceName}.json`)
  } catch (error) {
    console.error(`Error saving ${resourceName}.json:`, error)
  }
}

async function loadJsonFile(filePath: string) {
  try {
    const f = file(filePath)
    return await f.json()
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error)
    return []
  }
}

async function initializeData() {
  try {
    const dataDir = './fake-server'
    const files = readdirSync(dataDir)
    
    for (const fileName of files) {
      if (fileName.endsWith('.json')) {
        const resourceName = fileName.replace('.json', '')
        const data = await loadJsonFile(`${dataDir}/${fileName}`)
        store.set(resourceName, data)
        console.log(`Loaded ${data.length} items from ${fileName}`)
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error)
  }
}

await initializeData()

const handlers = {
  async GET(resourceName: string, id?: string) {
    const data: any[] = store.get(resourceName) || []
    
    if (id) {
      const item = data.find((item: any) => item.id.toString() === id)
      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), { 
          status: 404,
          headers: responseHeaders
        })
      }
      return new Response(JSON.stringify(item), {
        headers: responseHeaders
      })
    }
    
    return new Response(JSON.stringify(data), {
      headers: responseHeaders
    })
  },

  async POST(resourceName: string, id: string | undefined, req: Request) {
    if (!req.body) {
      return new Response(JSON.stringify({ error: 'No request body' }), {
        status: 400,
        headers: responseHeaders
      })
    }

    const data = store.get(resourceName) || []
    const body = await req.text()
    const newItem = JSON.parse(body)

    const maxId = Math.max(...data.map((item: any) => Number(item.id)), 0)
    newItem.id = maxId + 1

    data.push(newItem)
    store.set(resourceName, data)
    saveJsonFile(resourceName, data)
    return new Response(JSON.stringify(newItem), { 
      status: 201,
      headers: responseHeaders
    })
  },

  async PUT(resourceName: string, id: string | undefined, req: Request) {
    if (!req.body) {
      return new Response(JSON.stringify({ error: 'No request body' }), {
        status: 400,
        headers: responseHeaders
      })
    }

    const data = store.get(resourceName) || []
    const body = await req.text()
    const updateItem = JSON.parse(body)
    const index = data.findIndex((item: any) => item.id === updateItem.id)
    
    if (index === -1) {
      return new Response(JSON.stringify({ error: 'Item not found' }), { 
        status: 404,
        headers: responseHeaders
      })
    }
    
    data[index] = updateItem
    store.set(resourceName, data)
    saveJsonFile(resourceName, data)
    return new Response(JSON.stringify(updateItem), {
      headers: responseHeaders
    })
  },

  async DELETE(resourceName: string, id: string) {
    if (!id) {
      return new Response(JSON.stringify({ error: 'No ID provided' }), {
        status: 400,
        headers: responseHeaders
      })
    }

    const data = store.get(resourceName) || []
    const initialLength = data.length
    
    const filteredData = data.filter((item: any) => item.id.toString() !== id)
    
    if (filteredData.length === initialLength) {
      return new Response(JSON.stringify({ error: 'Item not found' }), { 
        status: 404,
        headers: responseHeaders
      })
    }
    
    store.set(resourceName, filteredData)

    saveJsonFile(resourceName, filteredData)
    return new Response(null, { 
      status: 204,
      headers: responseHeaders
    })
  }
}

const server = serve({
  port: 3001,
  hostname: 'localhost',
  development: true,
  
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: responseHeaders
      })
    }

    const method = req.method as keyof typeof handlers
    const { resourceName, id } = parsePath(path)
    
    console.log(`[${new Date().toISOString()}] ${method} ${path}`)
    
    try {
      if (!store.has(resourceName)) {
        return new Response(JSON.stringify({ error: 'Resource not found' }), {
          status: 404,
          headers: responseHeaders
        })
      }

      const handler = handlers[method]
      if (handler) {
        return await handler(resourceName, id, req)
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: responseHeaders
      })

    } catch (error) {
      console.error(`Error handling ${method} request to ${path}:`, error)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), {
        status: 500,
        headers: responseHeaders
      })
    }
  }
})

const resources = Array.from(store.keys()).join(', ')
console.log(`Fake server running at http://${server.hostname}:${server.port}

Available resources: ${resources}

For each resource, you can use:
- GET    /{resource}           - Get all items
- GET    /{resource}/{id}      - Get single item
- POST   /{resource}           - Create new item
- PUT    /{resource}           - Update item
- DELETE /{resource}/{id}      - Delete item`)