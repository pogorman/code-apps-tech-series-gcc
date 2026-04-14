"""Apply table + column descriptions defined in descriptions-plan.json.

Uses Dataverse Web API metadata PATCH (the Python SDK does not expose
EntityMetadata/AttributeMetadata writes). Headers:
  MSCRM.SolutionName: TheDataverseSolution  (tracks change in the solution)
  MSCRM.MergeLabels: true                   (preserve labels in other languages)

After all PATCHes succeed, publishes customizations.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from auth import get_token, load_env  # noqa: E402

import requests  # noqa: E402

load_env()
dv_url = os.environ["DATAVERSE_URL"].rstrip("/")
token = get_token()
API = f"{dv_url}/api/data/v9.2"

headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    "MSCRM.MergeLabels": "true",
    "MSCRM.SolutionName": "TheDataverseSolution",
}

# Load previously-captured metadata (MetadataIds + AttributeTypeName per column)
with open(os.path.join(os.path.dirname(__file__), "..", "solution-tables.json"), encoding="utf-8") as f:
    discovered = json.load(f)

table_meta_by_logical = {t["LogicalName"]: t for t in discovered["tables"]}

with open(os.path.join(os.path.dirname(__file__), "..", "descriptions-plan.json"), encoding="utf-8") as f:
    plan = json.load(f)

LANGUAGE_CODE = plan["language_code"]


def label(text):
    return {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [{
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": text,
            "LanguageCode": LANGUAGE_CODE,
        }],
    }


# Dataverse metadata uses read-modify-write (no PATCH, no per-property PUT).
# For attributes, the GET must cast to the concrete type.
ODATA_TYPE_BY_ATTRTYPE = {
    "StringType": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "MemoType": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
    "DateTimeType": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
    "LookupType": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
    "PicklistType": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
    "BooleanType": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
    "IntegerType": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
    "DecimalType": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
    "DoubleType": "Microsoft.Dynamics.CRM.DoubleAttributeMetadata",
    "MoneyType": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
    "UniqueidentifierType": "Microsoft.Dynamics.CRM.UniqueIdentifierAttributeMetadata",
}


def put_entity_description(logical_name, description):
    get_url = f"{API}/EntityDefinitions(LogicalName='{logical_name}')"
    gh = {k: v for k, v in headers.items() if k not in ("Content-Type", "MSCRM.MergeLabels", "MSCRM.SolutionName")}
    g = requests.get(get_url, headers=gh)
    if g.status_code != 200:
        return g
    body = g.json()
    body["Description"] = label(description)
    return requests.put(get_url, headers=headers, data=json.dumps(body))


def put_attribute_description(entity_logical, attr_meta, description):
    attr_type = attr_meta.get("AttributeTypeName")
    odata_type = ODATA_TYPE_BY_ATTRTYPE.get(attr_type)
    if not odata_type:
        return None, f"unsupported AttributeTypeName={attr_type}"
    base = (
        f"{API}/EntityDefinitions(LogicalName='{entity_logical}')"
        f"/Attributes({attr_meta['MetadataId']})"
    )
    get_url = f"{base}/{odata_type}"
    gh = {k: v for k, v in headers.items() if k not in ("Content-Type", "MSCRM.MergeLabels", "MSCRM.SolutionName")}
    g = requests.get(get_url, headers=gh)
    if g.status_code != 200:
        return g, None
    body = g.json()
    body["Description"] = label(description)
    return requests.put(get_url, headers=headers, data=json.dumps(body)), None


entities_updated = []
attrs_updated = []
failures = []

for logical, tdef in plan["tables"].items():
    disc = table_meta_by_logical.get(logical)
    if not disc:
        failures.append(f"{logical}: not found in solution-tables.json — run list-solution-tables.py first")
        continue

    # --- table description ---
    r = put_entity_description(logical, tdef["description"])
    if r.status_code in (200, 204):
        entities_updated.append(logical)
        print(f"  [OK ] table {logical}", flush=True)
    else:
        failures.append(f"{logical} (entity): {r.status_code} {r.text[:300]}")
        print(f"  [ERR] table {logical} -> {r.status_code} {r.text[:300]}", flush=True)

    # --- column descriptions ---
    col_index = {c["LogicalName"]: c for c in disc.get("Columns", [])}
    for col_logical, col_desc in (tdef.get("columns") or {}).items():
        cmeta = col_index.get(col_logical)
        if not cmeta:
            failures.append(f"{logical}.{col_logical}: not in discovered metadata")
            print(f"  [ERR] col   {logical}.{col_logical} -> not discovered", flush=True)
            continue
        r, err = put_attribute_description(logical, cmeta, col_desc)
        if err:
            failures.append(f"{logical}.{col_logical}: {err}")
            print(f"  [ERR] col   {logical}.{col_logical} -> {err}", flush=True)
            continue
        if r.status_code in (200, 204):
            attrs_updated.append(f"{logical}.{col_logical}")
            print(f"  [OK ] col   {logical}.{col_logical}", flush=True)
        else:
            failures.append(f"{logical}.{col_logical}: {r.status_code} {r.text[:300]}")
            print(f"  [ERR] col   {logical}.{col_logical} -> {r.status_code} {r.text[:300]}", flush=True)

print(f"\nEntities updated: {len(entities_updated)}", flush=True)
print(f"Attributes updated: {len(attrs_updated)}", flush=True)
print(f"Failures: {len(failures)}", flush=True)

if failures:
    print("\nFailures:", flush=True)
    for f_line in failures:
        print(f"  - {f_line}", flush=True)
    sys.exit(1)

# --- Publish customizations ---
print("\nPublishing customizations...", flush=True)
pub_url = f"{API}/PublishAllXml"
r = requests.post(pub_url, headers={k: v for k, v in headers.items() if k not in ("MSCRM.MergeLabels", "MSCRM.SolutionName")})
if r.status_code in (200, 204):
    print("  [OK ] published", flush=True)
else:
    print(f"  [ERR] publish -> {r.status_code} {r.text[:300]}", flush=True)
    sys.exit(1)
