#!/usr/bin/env python3
"""
D2C Activations — Populate Script Template
==========================================

Builds the Activations table in a fresh Airtable base from the schema spec,
and populates it with placeholder rows. Replace placeholders with your label's
data before running, OR use the CSV import block at the bottom.

This is a TEMPLATE. You must:
  1. Replace AIRTABLE_TOKEN and BASE_ID with your own values
  2. Replace the LABEL_NAME, WORKING_YEAR, and PLACEHOLDER rows with real data
  3. Run once. The script is idempotent on table creation but will duplicate
     rows if run twice — see the "if __name__" block.

Originally built for RCA Records, May 2026.
Adapted for label-agnostic use as part of the D2C Activations Kit v1.

Dependencies:
    pip install requests

Usage:
    python populate-template.py
"""

import requests
import time
import json

# ============================================================================
# CONFIGURATION — replace these before running
# ============================================================================

AIRTABLE_TOKEN = "YOUR_PERSONAL_ACCESS_TOKEN_HERE"  # pat... format
BASE_ID = "YOUR_BASE_ID_HERE"                        # app... format
TABLE_NAME = "Activations"

LABEL_NAME = "Your Label"           # used in print statements only
WORKING_YEAR = 2026                  # the year for placeholder rows

# ============================================================================
# SCHEMA — Activations table field definitions (from schema-spec.md)
# ============================================================================

ACTIVATIONS_SCHEMA = {
    "name": TABLE_NAME,
    "fields": [
        {"name": "Name", "type": "singleLineText"},
        {"name": "Artist", "type": "singleLineText"},
        {"name": "Initiative", "type": "singleLineText"},
        {
            "name": "Category",
            "type": "singleSelect",
            "options": {
                "choices": [
                    {"name": "Official Releases"},
                    {"name": "Merch Drop"},
                    {"name": "Shop Initiative"},
                    {"name": "Additional Music Product"},
                    {"name": "Cultural Moment"},
                ]
            },
        },
        {
            "name": "Status",
            "type": "singleSelect",
            "options": {
                "choices": [
                    {"name": "Confirmed"},
                    {"name": "Planned"},
                    {"name": "Exploring"},
                    {"name": "Cancelled"},
                ]
            },
        },
        {"name": "Acquisition Target", "type": "checkbox", "options": {"icon": "check", "color": "greenBright"}},
        {"name": "Year", "type": "number", "options": {"precision": 0}},
        {
            "name": "Month",
            "type": "singleSelect",
            "options": {
                "choices": [
                    {"name": m} for m in [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December",
                    ]
                ]
            },
        },
        {"name": "Date Text", "type": "singleLineText"},
        {"name": "Notes", "type": "multilineText"},
        {
            "name": "Source",
            "type": "singleSelect",
            "options": {
                "choices": [
                    {"name": "A&R"},
                    {"name": "Release Planning"},
                    {"name": "Commercial Partnerships"},
                    {"name": "D2C / E-commerce"},
                    {"name": "Shop"},
                    {"name": "Brand Partnerships"},
                    {"name": "Other"},
                ]
            },
        },
        {"name": "Color Override", "type": "singleLineText"},
        {"name": "ODA Goal", "type": "number", "options": {"precision": 0}},
    ],
}


# ============================================================================
# PLACEHOLDER ROWS — replace these with your label's actual activations
# ============================================================================

PLACEHOLDER_ROWS = [
    {
        "Name": "Placeholder Artist — Anthology Vinyl Pre-Order",
        "Artist": "Placeholder Artist",
        "Initiative": "Anthology Vinyl Pre-Order",
        "Category": "Additional Music Product",
        "Status": "Confirmed",
        "Acquisition Target": False,
        "Year": WORKING_YEAR,
        "Month": "April",
        "Date Text": f"April 3, {WORKING_YEAR}",
        "Notes": "• Anchor: album cycle\n• Partner: in-house D2C\n• Channel: label shop\n• Risks: vendor capacity",
        "Source": "Release Planning",
        "ODA Goal": 5000,
    },
    {
        "Name": "Father's Day Collection",
        "Initiative": "Father's Day Collection",
        "Category": "Cultural Moment",
        "Status": "Planned",
        "Acquisition Target": False,
        "Year": WORKING_YEAR,
        "Month": "June",
        "Date Text": "Father's Day weekend",
        "Notes": "• Anchor: cultural moment\n• Cross-roster shop initiative\n• Channel: label shop + mailing list",
        "Source": "Shop",
        "ODA Goal": 2500,
    },
    {
        "Name": "Placeholder Artist 2 — Tour Merch Capsule",
        "Artist": "Placeholder Artist 2",
        "Initiative": "Tour Merch Capsule",
        "Category": "Merch Drop",
        "Status": "Exploring",
        "Acquisition Target": True,
        "Year": WORKING_YEAR,
        "Month": "September",
        "Date Text": f"Q3 {WORKING_YEAR} — tour kickoff",
        "Notes": "• Anchor: tour cycle\n• D2C rights NOT secured — flagged for Business Affairs\n• Partner: tour merch vendor TBD",
        "Source": "Commercial Partnerships",
        "ODA Goal": 1000,
    },
]


# ============================================================================
# API HELPERS
# ============================================================================

API_BASE = "https://api.airtable.com/v0"
HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_TOKEN}",
    "Content-Type": "application/json",
}


def create_table(base_id, schema):
    """Create the Activations table from the schema definition."""
    url = f"{API_BASE}/meta/bases/{base_id}/tables"
    resp = requests.post(url, headers=HEADERS, json=schema, timeout=30)
    if resp.status_code in (200, 201):
        table_id = resp.json().get("id")
        print(f"  ✓ Created table '{schema['name']}' → {table_id}")
        return table_id
    elif resp.status_code == 422 and "DUPLICATE" in resp.text.upper():
        print(f"  ⚠ Table '{schema['name']}' already exists — skipping creation")
        return None
    else:
        print(f"  ✗ Failed to create table: {resp.status_code} {resp.text}")
        return None


def create_record(base_id, table_name, fields):
    """Create a single record. Returns record ID or None on failure."""
    url = f"{API_BASE}/{base_id}/{table_name}"
    payload = {"fields": fields}
    resp = requests.post(url, headers=HEADERS, json=payload, timeout=30)
    if resp.status_code in (200, 201):
        rec_id = resp.json().get("id")
        print(f"  ✓ {fields.get('Name', 'unnamed')} → {rec_id}")
        return rec_id
    else:
        print(f"  ✗ Failed: {fields.get('Name', 'unnamed')} — {resp.status_code} {resp.text[:200]}")
        return None


# ============================================================================
# OPTIONAL: CSV IMPORT
# ============================================================================
#
# To populate from a CSV instead of inline placeholders, uncomment this block.
# CSV must have headers matching the schema field names exactly.
#
# import csv
#
# def load_from_csv(path):
#     rows = []
#     with open(path, newline='', encoding='utf-8') as f:
#         reader = csv.DictReader(f)
#         for row in reader:
#             # Convert types: Year and ODA Goal to int, Acquisition Target to bool
#             if row.get("Year"):
#                 row["Year"] = int(row["Year"])
#             if row.get("ODA Goal"):
#                 row["ODA Goal"] = int(row["ODA Goal"])
#             if row.get("Acquisition Target"):
#                 row["Acquisition Target"] = row["Acquisition Target"].upper() == "TRUE"
#             # Drop empty strings — Airtable rejects them on number/select fields
#             rows.append({k: v for k, v in row.items() if v not in ("", None)})
#     return rows


# ============================================================================
# MAIN
# ============================================================================

def main():
    print(f"\n=== {LABEL_NAME} D2C Activations — Build & Populate ===\n")

    if AIRTABLE_TOKEN.startswith("YOUR_") or BASE_ID.startswith("YOUR_"):
        print("✗ Replace AIRTABLE_TOKEN and BASE_ID at the top of this file before running.")
        return

    print("1. Creating Activations table...")
    create_table(BASE_ID, ACTIVATIONS_SCHEMA)
    time.sleep(2)

    print("\n2. Populating placeholder rows...")
    # To use CSV instead: rows = load_from_csv("your-file.csv")
    rows = PLACEHOLDER_ROWS

    for r in rows:
        create_record(BASE_ID, TABLE_NAME, r)
        time.sleep(0.3)  # rate limit courtesy

    print(f"\n✓ Done. Inserted {len(rows)} placeholder rows.")
    print(f"   Open https://airtable.com/{BASE_ID} to view.")


if __name__ == "__main__":
    main()
