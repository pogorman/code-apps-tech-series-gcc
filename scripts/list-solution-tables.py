"""Discover 'The Dataverse Solution' and list the tables it contains.

Strategy:
  1. Query the 'solution' table for any record with friendlyname matching
     variations of 'The Dataverse Solution' (case-insensitive).
  2. Read its solutioncomponent rows filtered to componenttype=1 (Entity).
  3. For each component, resolve the objectid (MetadataId) to an entity via
     EntityDefinitions(MetadataId) to get LogicalName + DisplayName + current Description.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from auth import get_credential, get_token, load_env  # noqa: E402

from PowerPlatform.Dataverse.client import DataverseClient  # noqa: E402
import requests  # noqa: E402

load_env()
dv_url = os.environ["DATAVERSE_URL"].rstrip("/")
client = DataverseClient(dv_url, get_credential())

# ---- Step 1: find the solution ----
def _flatten(paged):
    out = []
    for item in paged:
        if isinstance(item, list):
            out.extend(item)
        else:
            out.append(item)
    return out


solutions = _flatten(client.records.get(
    "solution",
    select=["solutionid", "uniquename", "friendlyname", "publisherid", "version", "ismanaged"],
    filter="ismanaged eq false",
))
print(f"Found {len(solutions)} unmanaged solutions", flush=True)

target = None
for s in solutions:
    name = (s.get("friendlyname") or "").strip()
    if name.lower() == "the dataverse solution":
        target = s
        break

if not target:
    # try uniquename match too
    for s in solutions:
        un = (s.get("uniquename") or "").lower()
        if "dataverse" in un and "solution" in un:
            target = s
            break

if not target:
    print("ERROR: Could not find 'The Dataverse Solution'. Candidates:", flush=True)
    for s in solutions:
        print(f"  - {s.get('friendlyname')!r} (uniquename={s.get('uniquename')})", flush=True)
    sys.exit(1)

print(f"\nMatched: {target.get('friendlyname')!r} (uniquename={target.get('uniquename')}, version={target.get('version')})", flush=True)
print(f"solutionid = {target['solutionid']}", flush=True)

# ---- Step 2: list entity components (componenttype = 1) ----
components = _flatten(client.records.get(
    "solutioncomponent",
    select=["componenttype", "objectid", "rootcomponentbehavior"],
    filter=f"_solutionid_value eq {target['solutionid']} and componenttype eq 1",
))
print(f"\nFound {len(components)} Entity components", flush=True)

# ---- Step 3: resolve each objectid (MetadataId) to entity metadata ----
token = get_token()
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
}

def _label(node):
    if not node:
        return None
    ul = node.get("UserLocalizedLabel") or {}
    return ul.get("Label")


tables = []
for c in components:
    mdid = c["objectid"]
    url = (
        f"{dv_url}/api/data/v9.2/EntityDefinitions({mdid})"
        "?$select=MetadataId,LogicalName,SchemaName,DisplayName,Description,IsCustomEntity,EntitySetName"
    )
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        print(f"  WARN: {mdid} -> {r.status_code} {r.text[:200]}", flush=True)
        continue
    e = r.json()
    entry = {
        "MetadataId": e["MetadataId"],
        "LogicalName": e["LogicalName"],
        "SchemaName": e["SchemaName"],
        "DisplayName": _label(e.get("DisplayName")),
        "Description": _label(e.get("Description")),
        "IsCustom": e.get("IsCustomEntity"),
        "EntitySetName": e.get("EntitySetName"),
        "Columns": [],
    }

    # Pull tdvsp_ attributes for tdvsp_ tables (filter client-side since $filter
    # on MetadataEntities doesn't support startswith)
    if entry["LogicalName"].startswith("tdvsp_"):
        attrs_url = (
            f"{dv_url}/api/data/v9.2/EntityDefinitions({mdid})/Attributes"
            "?$select=MetadataId,LogicalName,SchemaName,DisplayName,Description,AttributeType,AttributeTypeName,IsCustomAttribute"
        )
        ar = requests.get(attrs_url, headers=headers)
        if ar.status_code != 200:
            print(f"  WARN attrs {entry['LogicalName']} -> {ar.status_code} {ar.text[:200]}", flush=True)
        else:
            for a in ar.json().get("value", []):
                if not a.get("LogicalName", "").startswith("tdvsp_"):
                    continue
                entry["Columns"].append({
                    "MetadataId": a["MetadataId"],
                    "LogicalName": a["LogicalName"],
                    "SchemaName": a["SchemaName"],
                    "DisplayName": _label(a.get("DisplayName")),
                    "Description": _label(a.get("Description")),
                    "AttributeType": a.get("AttributeType"),
                    "AttributeTypeName": (a.get("AttributeTypeName") or {}).get("Value"),
                    "IsCustom": a.get("IsCustomAttribute"),
                    "@odata.type": a.get("@odata.type"),
                })

    tables.append(entry)

tables.sort(key=lambda t: t["LogicalName"])
for t in tables:
    flag = "custom" if t["IsCustom"] else "system"
    desc = t["Description"] or "(no description)"
    print(f"  [{flag}] {t['LogicalName']:35s} {str(t['DisplayName']):30s} -> {desc[:80]}", flush=True)
    for col in t.get("Columns", []):
        cdesc = col["Description"] or "(no description)"
        print(f"      - {col['LogicalName']:35s} ({col['AttributeTypeName']}) -> {cdesc[:80]}", flush=True)

out_path = os.path.join(os.path.dirname(__file__), "..", "solution-tables.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({
        "solution": {
            "solutionid": target["solutionid"],
            "uniquename": target.get("uniquename"),
            "friendlyname": target.get("friendlyname"),
            "version": target.get("version"),
        },
        "tables": tables,
    }, f, indent=2)
print(f"\nWrote {out_path}", flush=True)
