# BFarm Fake Server

## Installation

1. Clone the repository:
```bash
git clone https://github.com/bfarm-sep490/bfarm-fake-server.git
cd bfarm-fake-server
```

2. Install dependencies:
```bash
bun install
```

## Usage

### Starting the Server

Run the development server:
```bash
bun start
```

The server will start at `http://localhost:3001`

### API Endpoints

The following endpoints are available for each resource:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{resource}` | Get all items |
| GET | `/{resource}/{id}` | Get a single item by ID |
| POST | `/{resource}` | Create a new item |
| PUT | `/{resource}` | Update an existing item |
| DELETE | `/{resource}/{id}` | Delete an item by ID |

### Example Resource: Fertilizers

#### Get all fertilizers
```bash
curl http://localhost:3001/fertilizers
```

#### Get a single fertilizer
```bash
curl http://localhost:3001/fertilizers/1
```

#### Create a new fertilizer
```bash
curl -X POST http://localhost:3001/fertilizers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Fertilizer",
    "description": "Description here",
    "image": "image.jpg",
    "available_quantity": 100.0,
    "unit": "Bao 2kg",
    "total_quantity": 150.0,
    "status": "InStock",
    "type": "Organic"
  }'
```

#### Update a fertilizer
```bash
curl -X PUT http://localhost:3001/fertilizers \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "name": "Updated Fertilizer",
    "description": "Updated description",
    "image": "updated_image.jpg",
    "available_quantity": 75.0,
    "unit": "Bao 2kg",
    "total_quantity": 150.0,
    "status": "InStock",
    "type": "Organic"
  }'
```

#### Delete a fertilizer
```bash
curl -X DELETE http://localhost:3001/fertilizers/1
```

### Adding New Resources

1. Create a new JSON file in the `fake-server` directory:
```bash
touch fake-server/your-resource.json
```

2. Add your data as a JSON array:
```json
[
  {
    "id": 1,
    "field1": "value1",
    ...
  }
]
```

The server will automatically detect and serve the new resource.

## Development

### Project Structure
```
bfarm-fake-server/
├── package.json
└── fake-server/
    ├── serve.ts
    └── fertilizers.json
```

### Scripts

- `bun start` - Start the development server