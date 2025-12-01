Here is the logic documentation for the Service, Package, and Reservation system. This guide explains how the database tables interact to handle bundling, purchasing, and usage tracking.

Logic Documentation: Services, Packages & Reservations
1. The Hierarchy: From Concept to Product
The system separates the concept of a service from the sellable item.

A. Service (The Category)
What it is: The abstract definition of what is being offered.

Example: "Deep Tissue Massage".

Purpose: Grouping and display. You cannot "buy" a Service directly; you must choose a specific version of it.

B. Service Variant (The Product)
What it is: The concrete, sellable version of a Service with specific constraints.

Example: "Deep Tissue Massage - 60 Minutes - $100".

Key Fields: duration_minutes, price.

Logic: Every Reservation must be linked to a variant_id. This tells the system exactly how much time to block on the calendar.

2. The Package System (Bundling)
Packages allow you to sell multiple variants together, potentially at a discount.

A. The Package Template (The Menu)
Defined in: packages and package_items. This is what the Admin creates. It is a "recipe."

Scenario: Admin creates a "5-Session Massage Pack".

Data Structure:

packages table entry: Name="5-Session Pack", Price=$450.

package_items table entry: Links to the "Deep Tissue 60min" Variant, with quantity = 5.

Note: A package can contain mixes. For example, a "Wedding Prep" package could have:

3x Personal Training Sessions (Variant A)

2x Nutrition Consultations (Variant B)

B. The Purchased Package (The Wallet)
Defined in: user_packages. This is created when a user actually buys a package. It records the transaction timestamp and expiry date.

C. The Ledger (Usage Tracking)
Defined in: user_package_items. This is the most critical logic component.

Logic: When a user_package is created, the system copies the data from the template package_items into user_package_items.

Why copy it?

Snapshot: If you change the package definition next week, it shouldn't affect the user who bought it today.

Tracking: This table holds the total_quantity (e.g., 5) and used_quantity (e.g., 0). This acts as the user's "bank account" for services.

3. The Reservation Workflow
How a booking flows through the system depending on payment method.

Scenario A: Pay-As-You-Go (Direct Booking)
The user selects a service and pays for it individually.

User Selects: "Deep Tissue 60min" (Variant ID: 101).

System Action: Creates a row in reservations.

Data:

variant_id: 101

user_package_item_id: NULL

status: 'confirmed' (after payment)

Scenario B: Booking via Package (Redeeming a Credit)
The user has a "5-Session Pack" and wants to use one session.

User Selects: "Deep Tissue 60min".

System Check: The system looks at user_package_items for this user.

Query: Does this user have a ledger entry where variant_id = 101 AND used_quantity < total_quantity?

System Action (Booking):

Creates a row in reservations.

variant_id: 101

user_package_item_id: 505 (The ID of their ledger row).

System Action (Deduction):

Updates user_package_items row 505.

Increments used_quantity by +1.

4. Visualizing the Data Flow
Here is how the data moves from the Admin definition to the User's usage.

Code snippet

flowchart TD
    subgraph ADMIN_DEFINITIONS [Admin Panel]
        S[Service: Massage] --> V[Variant: 60min / $100]
        P[Package: 5-Pack] -->|Contains| PI[Package Item: Qty 5 of Variant]
        PI -.-> V
    end

    subgraph USER_PURCHASE [User Purchase Event]
        User((User)) -->|Buys| UP[User Package]
        UP -->|System Creates| UPI[User Package Item / Ledger]
        UPI -->|Initial State| State1[Total: 5 / Used: 0]
    end

    subgraph BOOKING_EVENT [Booking Event]
        User -->|Books Session| R[Reservation]
        R -->|Refers to| V
        R -->|Consumes Credit| UPI
        UPI -->|New State| State2[Total: 5 / Used: 1]
    end
    
    P -.-> UP
5. FAQ / Edge Cases
1. What if a Package contains different services? The user_package_items table will simply have multiple rows for that purchase.

Row 1: Variant A (Massage), Total: 3, Used: 0

Row 2: Variant B (Facial), Total: 1, Used: 0 When booking a massage, the system only checks Row 1.

2. What happens when a user cancels a reservation? If the reservation was made using a package (user_package_item_id is NOT NULL):

Set Reservation status to cancelled.

Find the linked user_package_item.

Decrement used_quantity by -1 (Refunding the credit).

3. Why link Reservation to Variant AND Package Item?

variant_id is required to know how long the appointment is (e.g., 60 mins) to block the calendar.

user_package_item_id is required to know how it was paid for.