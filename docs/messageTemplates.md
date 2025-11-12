# WhatsApp Message Templates for Resort Owners

This document describes the WhatsApp message templates used in the sales channel POC for resort owners.

## Template 1: Welcome & Qualifier

**Name:** `welcome_qualifier`

**Purpose:** Greet new guests and qualify their intent

**Components:**
- Body: "Hi {{1}}, thanks for reaching out to [Resort Name]! Are you interested in:"
- Buttons:
  - "Accommodations"
  - "Experiences"
  - "Special Offers"

## Template 2: Accommodation Suggestions

**Name:** `product_suggestions`

**Purpose:** Show 2-3 curated accommodations based on guest interest

**Components:**
- Header: "{{1}}" (Category name)
- Body: "Hi {{1}}, here are some popular options in this category:"
- Body (repeated for each accommodation):
  - "{{1}}" (Accommodation name)
  - "{{2}}" (Accommodation benefit)
  - "{{3}}" (Price per night)
- Button: "View Accommodations"

## Template 3: Booking Reminder #1

**Name:** `cart_reminder_1`

**Purpose:** First reminder for abandoned bookings

**Components:**
- Body: "Hi {{1}}, you left {{2}} from {{3}} in your booking. Complete your reservation now: {{4}}"

## Template 4: Booking Reminder #2

**Name:** `cart_reminder_2`

**Purpose:** Final reminder for abandoned bookings

**Components:**
- Body: "Last chance, {{1}}! Your booking at {{2}} is about to expire. Don't miss out!"

## Template 5: Reservation Confirmation

**Name:** `order_confirmation`

**Purpose:** Confirm reservation placement

**Components:**
- Body: "Thanks for your reservation, {{1}}! Reservation #{{2}} for {{3}} has been received. Check-in: {{4}}."

## Template 6: Post-Stay Review

**Name:** `post_purchase_review`

**Purpose:** Request accommodation review

**Components:**
- Body: "Hi {{1}}, how would you rate your stay in {{2}}?"
- Button: "Leave Review"

## Template 7: Upsell Offer

**Name:** `upsell_offer`

**Purpose:** Suggest complementary experiences

**Components:**
- Body: "Hi {{1}}, since you enjoyed {{2}}, you might love {{3}} for just {{4}}!"
- Button: "View Experience"