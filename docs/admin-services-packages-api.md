# Admin Services, Variants & Packages API (Schema v2)

These endpoints sit under `/admin` and require admin authentication. They follow `db-schema-v2.sql` and the service/package logic guide.

## Services (Base Definitions)
Services are the high-level category (e.g., "Massage"). Pricing and duration live on variants.

- **Create service** `POST /admin/services`
  - Required: `name` (string)
  - Optional: `description` (text), `notes` (text), `is_active` (boolean)
  - Example:
    ```json
    {
      "name": "Deep Tissue Massage",
      "description": "Category for all deep tissue offerings",
      "notes": "Showcase variants with different durations",
      "is_active": true
    }
    ```
- **List services** `GET /admin/services`
  - Query: `includeVariants` (`true|false`), `includeProviders` (`true|false`)
  - Response includes variants/providers when requested.
- **Get service** `GET /admin/services/:serviceId`
  - Same query flags as list.
- **Update service** `PUT /admin/services/:serviceId`
  - Body: any of `name`, `description`, `notes`, `is_active`.
- **Delete service** `DELETE /admin/services/:serviceId`

## Service Variants (Sellable Units)
Variants carry the duration and price for a service (e.g., "60 min / $90").

- **Create variant** `POST /admin/services/:serviceId/variants`
  - Required: `name`, `duration_minutes` (int > 0), `price` (decimal >= 0)
  - Optional: `is_active` (boolean)
  - If `name` is omitted/blank, it defaults to the parent service name.
  - Example:
    ```json
    {
      "name": "60 Minutes",
      "duration_minutes": 60,
      "price": 90,
      "is_active": true
    }
    ```
- **List variants for a service** `GET /admin/services/:serviceId/variants`
  - Query: `includeService` (`true|false`)
- **Get variant** `GET /admin/service-variants/:variantId`
  - Query: `includeService` (`true|false`)
- **Update variant** `PUT /admin/service-variants/:variantId`
  - Body: any of `name`, `duration_minutes`, `price`, `is_active`.
- **Delete variant** `DELETE /admin/service-variants/:variantId`

## Packages (Templates)
Packages bundle one or more variants with quantities.

- **Create package** `POST /admin/packages`
  - Required: `name`, `items` (array)
  - `items`: array of `{ "variant_id": number, "quantity": positive integer }`
    - Duplicate variant IDs are merged; quantities are summed.
  - Optional: `description`, `notes`, `price` (overall package price), `is_active`, `total_duration` (defaults to sum of item durations).
  - Example:
    ```json
    {
      "name": "5x Deep Tissue 60m",
      "description": "Pack of five 60-minute sessions",
      "price": 430,
      "items": [
        { "variant_id": 12, "quantity": 5 }
      ]
    }
    ```
- **List packages** `GET /admin/packages`
  - Query: `includeItems` (`true|false`, default true)
  - Items include variant + parent service details.
- **Get package** `GET /admin/packages/:packageId`
  - Query: `includeItems` (`true|false`, default true)
- **Update package** `PUT /admin/packages/:packageId`
  - Body: any of `name`, `description`, `notes`, `price`, `is_active`, `total_duration`.
  - To change contents, pass `items` (same shape as create). When provided, items are fully replaced and `total_duration` is recomputed unless explicitly set.
- **Delete package** `DELETE /admin/packages/:packageId`

## Validation & Integrity Notes
- Variant IDs in package items must exist; the API fails with the missing IDs listed.
- Package item quantities must be positive integers; invalid payloads return 400.
- Services/variants include `is_active` to control availability; variant endpoints enforce parent existence.
- Package creation/update runs in a transaction so definitions and items stay in sync.

## Useful Fetch Patterns
- Admin listing with everything: `GET /admin/services?includeVariants=true&includeProviders=true`
- Public services without pricing (existing route): `GET /public/services` returns services with variants but strips `price` from each variant.
