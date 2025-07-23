# Eden's API
- run command 'npm run start'
  or run command 'npm run dev' [nodemon]

## Delhivery API Integration

### Environment Variables
Add these to your `.env` file:
```
DELHIVERY_API_KEY=1abb113f5b64247cbfdd5d212be7ffda7b39cf3f
DELHIVERY_WAREHOUSE=JubiliSURFACE-B2C
DELHIVERY_BASE_URL=https://staging-express.delhivery.com
```

### Endpoints

**Create Shipment:**
- `POST /api/delhivery/create`
  - Body: `{ orderId, address, ... }`

**Track Shipment:**
- `GET /api/delhivery/track/:awb`

**Generate Shipping Label (PDF):**
- `GET /api/delhivery/label/:awb`

**Schedule Pickup:**
- `POST /api/delhivery/pickup`
  - Body: `{ awb, expected_package_count, pickup_date, reference_number, ... }`

### Order Flow
1. User places an order (`POST /api/orders`)
2. Backend creates shipment and schedules pickup with Delhivery
3. AWB and tracking URL are returned
4. Use label and tracking endpoints as needed

### Testing
- Use the provided sandbox API key for all requests
- Validate order creation, AWB generation, label download, and tracking
- No real delivery will occur in sandbox
