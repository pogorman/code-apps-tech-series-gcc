# seed-data.ps1 - Bulk-create demo data in og-code GCC environment
# Uses PAC auth token + Dataverse Web API
# Run: powershell -ExecutionPolicy Bypass -File scripts/seed-data.ps1

$ErrorActionPreference = "Continue"
$env_url = "https://og-code.crm9.dynamics.com"
$api = "$env_url/api/data/v9.2"

# Get auth token from Azure CLI
Write-Host "Getting auth token from Azure CLI..." -ForegroundColor Cyan
$token = az account get-access-token --resource $env_url --query accessToken -o tsv 2>&1
if (-not $token -or $token -like "ERROR*") {
    Write-Error "Failed to get auth token. Run: az login --tenant 426a6ef4-2476-4eab-ae1c-1c9dc2bfca80 --scope https://og-code.crm9.dynamics.com/.default"
    exit 1
}
Write-Host "Auth token acquired." -ForegroundColor Green

$headers = @{
    "Authorization"    = "Bearer $token"
    "Content-Type"     = "application/json; charset=utf-8"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
    "Prefer"           = "return=representation"
}

function New-Record {
    param([string]$EntitySet, [hashtable]$Body)
    $json = $Body | ConvertTo-Json -Depth 10
    try {
        $response = Invoke-RestMethod -Uri "$api/$EntitySet" -Method Post -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) -ErrorAction Stop
        return $response
    } catch {
        Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ============================================================
# 1. ACCOUNTS (8 SLG-themed government customer accounts)
# ============================================================
Write-Host "`n=== Creating Accounts ===" -ForegroundColor Yellow

$accountData = @(
    @{ name = "City of Philadelphia"; telephone1 = "215-555-0100"; emailaddress1 = "info@phila.gov"; websiteurl = "https://www.phila.gov"; address1_line1 = "1401 JFK Blvd"; address1_city = "Philadelphia"; address1_stateorprovince = "PA"; address1_postalcode = "19102"; description = "Large urban municipality - 1.6M residents. Key digital transformation partner for 311 services and permitting modernization." },
    @{ name = "Commonwealth of Pennsylvania"; telephone1 = "717-555-0200"; emailaddress1 = "help@pa.gov"; websiteurl = "https://www.pa.gov"; address1_line1 = "501 N 3rd St"; address1_city = "Harrisburg"; address1_stateorprovince = "PA"; address1_postalcode = "17120"; description = "State government - 13M residents. Modernizing benefits enrollment and case management systems." },
    @{ name = "Los Angeles County"; telephone1 = "213-555-0300"; emailaddress1 = "cio@lacounty.gov"; websiteurl = "https://lacounty.gov"; address1_line1 = "500 W Temple St"; address1_city = "Los Angeles"; address1_stateorprovince = "CA"; address1_postalcode = "90012"; description = "Largest county in the US - 10M residents. Emergency management and social services AI pilot." },
    @{ name = "State of Texas HHS"; telephone1 = "512-555-0400"; emailaddress1 = "digital@hhsc.texas.gov"; websiteurl = "https://www.hhs.texas.gov"; address1_line1 = "4900 N Lamar Blvd"; address1_city = "Austin"; address1_stateorprovince = "TX"; address1_postalcode = "78751"; description = "Health and Human Services Commission. SNAP and Medicaid eligibility modernization." },
    @{ name = "City of Chicago"; telephone1 = "312-555-0500"; emailaddress1 = "it@chicago.gov"; websiteurl = "https://www.chicago.gov"; address1_line1 = "121 N LaSalle St"; address1_city = "Chicago"; address1_stateorprovince = "IL"; address1_postalcode = "60602"; description = "Third largest US city. Smart city IoT initiative and resident services portal." },
    @{ name = "Maryland Department of IT"; telephone1 = "410-555-0600"; emailaddress1 = "doit@maryland.gov"; websiteurl = "https://doit.maryland.gov"; address1_line1 = "100 Community Pl"; address1_city = "Crownsville"; address1_stateorprovince = "MD"; address1_postalcode = "21032"; description = "State CIO office. Cloud-first strategy, enterprise Power Platform adoption." },
    @{ name = "Maricopa County"; telephone1 = "602-555-0700"; emailaddress1 = "ets@maricopa.gov"; websiteurl = "https://www.maricopa.gov"; address1_line1 = "301 W Jefferson St"; address1_city = "Phoenix"; address1_stateorprovince = "AZ"; address1_postalcode = "85003"; description = "4th largest county. Elections systems modernization and public records automation." },
    @{ name = "New York State ITS"; telephone1 = "518-555-0800"; emailaddress1 = "fixit@its.ny.gov"; websiteurl = "https://its.ny.gov"; address1_line1 = "Empire State Plaza"; address1_city = "Albany"; address1_stateorprovince = "NY"; address1_postalcode = "12220"; description = "State IT services. Enterprise Copilot Studio rollout for constituent-facing chatbots." }
)

$accounts = @{}
foreach ($acct in $accountData) {
    # Check if account already exists
    $encodedName = [Uri]::EscapeDataString($acct.name)
    $existing = Invoke-RestMethod -Uri "$api/accounts?`$filter=name eq '$($acct.name)'&`$top=1" -Headers $headers -ErrorAction SilentlyContinue
    if ($existing.value -and $existing.value.Count -gt 0) {
        $id = $existing.value[0].accountid
        $accounts[$acct.name] = $id
        Write-Host "  EXISTS account: $($acct.name) -> $id" -ForegroundColor DarkGray
    } else {
        $result = New-Record -EntitySet "accounts" -Body $acct
        if ($result) {
            $id = $result.accountid
            $accounts[$acct.name] = $id
            Write-Host "  Created account: $($acct.name) -> $id" -ForegroundColor Gray
        }
    }
}

# ============================================================
# 2. CONTACTS (20 contacts, spread across accounts)
# ============================================================
Write-Host "`n=== Creating Contacts ===" -ForegroundColor Yellow

$contactData = @(
    # City of Philadelphia (3 contacts)
    @{ firstname = "Dana"; lastname = "Rivera"; jobtitle = "Chief Information Officer"; emailaddress1 = "dana.rivera@phila.gov"; telephone1 = "215-555-0101"; account = "City of Philadelphia" },
    @{ firstname = "Marcus"; lastname = "Chen"; jobtitle = "Deputy CIO for Digital Services"; emailaddress1 = "marcus.chen@phila.gov"; telephone1 = "215-555-0102"; account = "City of Philadelphia" },
    @{ firstname = "Priya"; lastname = "Patel"; jobtitle = "311 Program Manager"; emailaddress1 = "priya.patel@phila.gov"; telephone1 = "215-555-0103"; account = "City of Philadelphia" },

    # Commonwealth of PA (3 contacts)
    @{ firstname = "James"; lastname = "Washington"; jobtitle = "Secretary of Administration"; emailaddress1 = "jwashington@pa.gov"; telephone1 = "717-555-0201"; account = "Commonwealth of Pennsylvania" },
    @{ firstname = "Sarah"; lastname = "Kim"; jobtitle = "Enterprise Architect"; emailaddress1 = "skim@pa.gov"; telephone1 = "717-555-0202"; account = "Commonwealth of Pennsylvania" },
    @{ firstname = "Roberto"; lastname = "Garcia"; jobtitle = "Benefits Modernization Lead"; emailaddress1 = "rgarcia@pa.gov"; telephone1 = "717-555-0203"; account = "Commonwealth of Pennsylvania" },

    # LA County (3 contacts)
    @{ firstname = "Aaliyah"; lastname = "Johnson"; jobtitle = "Chief Data Officer"; emailaddress1 = "ajohnson@lacounty.gov"; telephone1 = "213-555-0301"; account = "Los Angeles County" },
    @{ firstname = "Kevin"; lastname = "Nakamura"; jobtitle = "Emergency Management Director"; emailaddress1 = "knakamura@lacounty.gov"; telephone1 = "213-555-0302"; account = "Los Angeles County" },
    @{ firstname = "Tanya"; lastname = "Brooks"; jobtitle = "Social Services IT Manager"; emailaddress1 = "tbrooks@lacounty.gov"; telephone1 = "213-555-0303"; account = "Los Angeles County" },

    # TX HHS (2 contacts)
    @{ firstname = "Miguel"; lastname = "Santos"; jobtitle = "Medicaid Systems Director"; emailaddress1 = "msantos@hhsc.texas.gov"; telephone1 = "512-555-0401"; account = "State of Texas HHS" },
    @{ firstname = "Linda"; lastname = "Tran"; jobtitle = "SNAP Modernization PM"; emailaddress1 = "ltran@hhsc.texas.gov"; telephone1 = "512-555-0402"; account = "State of Texas HHS" },

    # Chicago (2 contacts)
    @{ firstname = "DeShawn"; lastname = "Williams"; jobtitle = "Smart City Program Director"; emailaddress1 = "dwilliams@chicago.gov"; telephone1 = "312-555-0501"; account = "City of Chicago" },
    @{ firstname = "Emily"; lastname = "O'Brien"; jobtitle = "Resident Services Portal Lead"; emailaddress1 = "eobrien@chicago.gov"; telephone1 = "312-555-0502"; account = "City of Chicago" },

    # Maryland DoIT (2 contacts)
    @{ firstname = "Raj"; lastname = "Mehta"; jobtitle = "Cloud Solutions Architect"; emailaddress1 = "rmehta@maryland.gov"; telephone1 = "410-555-0601"; account = "Maryland Department of IT" },
    @{ firstname = "Fatima"; lastname = "Al-Rashid"; jobtitle = "Power Platform Center of Excellence Lead"; emailaddress1 = "falrashid@maryland.gov"; telephone1 = "410-555-0602"; account = "Maryland Department of IT" },

    # Maricopa County (3 contacts)
    @{ firstname = "Chris"; lastname = "Dawson"; jobtitle = "Elections Technology Manager"; emailaddress1 = "cdawson@maricopa.gov"; telephone1 = "602-555-0701"; account = "Maricopa County" },
    @{ firstname = "Angela"; lastname = "Foster"; jobtitle = "Public Records Automation Lead"; emailaddress1 = "afoster@maricopa.gov"; telephone1 = "602-555-0702"; account = "Maricopa County" },
    @{ firstname = "Tom"; lastname = "Reeves"; jobtitle = "ETS Deputy Director"; emailaddress1 = "treeves@maricopa.gov"; telephone1 = "602-555-0703"; account = "Maricopa County" },

    # NY ITS (2 contacts)
    @{ firstname = "Sophie"; lastname = "Goldstein"; jobtitle = "Copilot Studio Program Manager"; emailaddress1 = "sgoldstein@its.ny.gov"; telephone1 = "518-555-0801"; account = "New York State ITS" },
    @{ firstname = "David"; lastname = "Park"; jobtitle = "AI Solutions Architect"; emailaddress1 = "dpark@its.ny.gov"; telephone1 = "518-555-0802"; account = "New York State ITS" }
)

$contacts = @{}
foreach ($c in $contactData) {
    $acctName = $c.account
    $c.Remove("account")
    $acctId = $accounts[$acctName]
    $c["parentcustomerid_account@odata.bind"] = "/accounts($acctId)"
    $result = New-Record -EntitySet "contacts" -Body $c
    $id = $result.contactid
    $contacts["$($c.firstname) $($c.lastname)"] = $id
    Write-Host "  Created contact: $($c.firstname) $($c.lastname) @ $acctName -> $id" -ForegroundColor Gray
}

# ============================================================
# 3. PROJECTS (6 projects, linked to accounts)
# ============================================================
Write-Host "`n=== Creating Projects ===" -ForegroundColor Yellow

$projectData = @(
    @{ tdvsp_name = "Philly 311 AI Chatbot"; tdvsp_description = "Deploy Copilot Studio agent for 311 service requests. Handles trash pickup scheduling, pothole reporting, and permit status inquiries. Target: 40% call deflection."; tdvsp_priority = 468510002; account = "City of Philadelphia" },
    @{ tdvsp_name = "PA Benefits Portal Modernization"; tdvsp_description = "Replace legacy COBOL-based eligibility system with Power Platform model-driven app + Azure AI document processing for benefits applications."; tdvsp_priority = 468510002; account = "Commonwealth of Pennsylvania" },
    @{ tdvsp_name = "LA County Emergency Response Dashboard"; tdvsp_description = "Real-time emergency management dashboard using Power BI embedded in model-driven app. Integrates CAD, weather, and social media feeds."; tdvsp_priority = 468510003; account = "Los Angeles County" },
    @{ tdvsp_name = "TX SNAP Eligibility Automation"; tdvsp_description = "Power Automate flows + AI Builder for automated SNAP eligibility pre-screening. Reduce processing time from 30 days to 7."; tdvsp_priority = 468510003; account = "State of Texas HHS" },
    @{ tdvsp_name = "Maryland Enterprise Power Platform CoE"; tdvsp_description = "Stand up Center of Excellence: governance, ALM pipelines, DLP policies, maker training program. 500+ target makers in Year 1."; tdvsp_priority = 468510001; account = "Maryland Department of IT" },
    @{ tdvsp_name = "Maricopa Public Records Portal"; tdvsp_description = "Power Pages portal for public records requests with automated routing, redaction workflow, and Copilot-assisted search."; tdvsp_priority = 468510000; account = "Maricopa County" }
)

$projects = @{}
foreach ($p in $projectData) {
    $acctName = $p.account
    $p.Remove("account")
    $acctId = $accounts[$acctName]
    $p["tdvsp_Account@odata.bind"] = "/accounts($acctId)"
    $result = New-Record -EntitySet "tdvsp_projects" -Body $p
    $id = $result.tdvsp_projectid
    $projects[$p.tdvsp_name] = $id
    Write-Host "  Created project: $($p.tdvsp_name) -> $id" -ForegroundColor Gray
}

# ============================================================
# 4. ACTION ITEMS (30 action items, mixed types/statuses/priorities, linked to accounts)
# ============================================================
Write-Host "`n=== Creating Action Items ===" -ForegroundColor Yellow

$actionItemData = @(
    # Work items linked to accounts
    @{ tdvsp_name = "Draft Philly 311 SOW"; tdvsp_description = "Write statement of work for the 311 chatbot pilot. Include success metrics, timeline, and resource requirements."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-20"; account = "City of Philadelphia" },
    @{ tdvsp_name = "Schedule Philly CIO briefing"; tdvsp_description = "Set up 30-min exec briefing with Dana Rivera to review chatbot pilot results and discuss Phase 2 expansion."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510002; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-18"; account = "City of Philadelphia" },
    @{ tdvsp_name = "Review PA benefits requirements doc"; tdvsp_description = "Sarah Kim sent over the 47-page requirements document. Need to map to Power Platform capabilities and flag gaps."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-25"; account = "Commonwealth of Pennsylvania" },
    @{ tdvsp_name = "Build PA eligibility proof of concept"; tdvsp_description = "Stand up quick PoC showing AI Builder form processing + model-driven app for eligibility workers. Use sample redacted forms from Roberto."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510001; tdvsp_date = "2026-05-02"; account = "Commonwealth of Pennsylvania" },
    @{ tdvsp_name = "LA County emergency dashboard wireframes"; tdvsp_description = "Create wireframe mockups for the real-time emergency dashboard. Meet with Kevin Nakamura to validate data source requirements."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-22"; account = "Los Angeles County" },
    @{ tdvsp_name = "TX HHS SNAP data analysis"; tdvsp_description = "Analyze sample SNAP application data to identify automation opportunities. Miguel sending anonymized dataset."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510001; tdvsp_date = "2026-05-01"; account = "State of Texas HHS" },
    @{ tdvsp_name = "Chicago smart city RFI response"; tdvsp_description = "Draft response to Chicago's RFI for smart city IoT platform. Highlight Power Platform + Azure IoT integration story."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510004; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-15"; account = "City of Chicago" },
    @{ tdvsp_name = "Maryland CoE governance framework"; tdvsp_description = "Help Fatima build the governance framework doc: DLP policies, environment strategy, connector policies, maker onboarding."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-28"; account = "Maryland Department of IT" },
    @{ tdvsp_name = "Maricopa records portal architecture"; tdvsp_description = "Design Power Pages architecture for public records. Need to handle authentication, payment processing, and redaction workflow."; tdvsp_priority = 468510000; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510001; tdvsp_date = "2026-05-10"; account = "Maricopa County" },
    @{ tdvsp_name = "NY ITS Copilot Studio demo prep"; tdvsp_description = "Build demo environment for Sophie's team. Show multi-topic agent with Dataverse knowledge base and authenticated API actions."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-17"; account = "New York State ITS" },
    @{ tdvsp_name = "Follow up on NY AI readiness assessment"; tdvsp_description = "David Park requested help with their AI readiness assessment. Send him the framework doc and schedule working session."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510002; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-19"; account = "New York State ITS" },
    @{ tdvsp_name = "Prepare tech series Code Apps demo"; tdvsp_description = "Get the GCC code app deployed and loaded with sample data for the tech series demo. Show full CRUD, dark mode, board view."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-14" },
    @{ tdvsp_name = "Update SLG AI playbook"; tdvsp_description = "Incorporate lessons learned from Philly and LA County pilots into the SLG AI adoption playbook. Add GCC-specific guidance."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510001; tdvsp_date = "2026-05-15" },
    @{ tdvsp_name = "Submit FY27 budget forecast"; tdvsp_description = "Annual budget forecast for SLG team. Include Azure consumption projections and licensing growth estimates."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510003; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-30" },
    @{ tdvsp_name = "Coordinate with Tim on GCC deployment"; tdvsp_description = "Tim is hitting the region config issue with pac code push. Send him the gccmoderate fix and walk through the power.config.json setup."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510005; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-13" },

    # Personal items
    @{ tdvsp_name = "Book flights for Ignite"; tdvsp_description = "Book flights and hotel for Microsoft Ignite. Check if gov rate is available at the conference hotel."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510000; tdvsp_date = "2026-05-01" },
    @{ tdvsp_name = "Renew passport"; tdvsp_description = "Passport expires in 4 months. Need to submit renewal before any international travel comes up."; tdvsp_priority = 468510000; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510000; tdvsp_date = "2026-06-01" },
    @{ tdvsp_name = "Schedule dentist appointment"; tdvsp_description = "Overdue for 6-month checkup. Call Dr. Morrison's office."; tdvsp_priority = 468510000; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510000; tdvsp_date = "2026-04-30" },
    @{ tdvsp_name = "Fix garage door opener"; tdvsp_description = "The garage door has been making that grinding noise again. Either fix the chain tension or call a repair service."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510000; tdvsp_date = "2026-04-20" },
    @{ tdvsp_name = "Plan summer vacation"; tdvsp_description = "Research options for a week in July. Kids want beach, need to balance with budget."; tdvsp_priority = 468510000; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510000; tdvsp_date = "2026-05-15" },

    # Learning items
    @{ tdvsp_name = "Complete AI-102 certification"; tdvsp_description = "Azure AI Engineer Associate exam. Already through 60% of the learning path. Schedule exam for end of month."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510002; tdvsp_date = "2026-04-30" },
    @{ tdvsp_name = "Read Semantic Kernel deep dive docs"; tdvsp_description = "New SK v1.x docs dropped. Need to understand the planner changes and how they affect the MCP integration pattern."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510002; tdvsp_date = "2026-04-25" },
    @{ tdvsp_name = "Watch Agents SDK workshop recording"; tdvsp_description = "2-hour workshop recording from the Agents team. Covers multi-agent orchestration and the new handoff protocol."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510002; tdvsp_date = "2026-04-22" },
    @{ tdvsp_name = "Build MCP server sample for SLG"; tdvsp_description = "Create a reference MCP server that wraps Dataverse APIs. Show it working with Claude Code and Copilot Studio."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510001; tdvsp_tasktype = 468510002; tdvsp_date = "2026-05-05" },
    @{ tdvsp_name = "Study for PL-600"; tdvsp_description = "Power Platform Solution Architect Expert exam. Need to review ALM, security model, and integration patterns sections."; tdvsp_priority = 468510000; tdvsp_taskstatus = 468510000; tdvsp_tasktype = 468510002; tdvsp_date = "2026-06-15" },

    # A few completed items
    @{ tdvsp_name = "Set up og-code GCC environment"; tdvsp_description = "Provision new GCC environment for the code apps tech series demo."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510005; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-12" },
    @{ tdvsp_name = "Deploy Dataverse solution to og-code"; tdvsp_description = "Export solution from og-dv commercial and import to og-code GCC. All tables, columns, and relationships verified."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510005; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-13" },
    @{ tdvsp_name = "Clone code app repo for GCC"; tdvsp_description = "Duplicate code-apps-tech-series to code-apps-tech-series-gcc. Update power.config.json, remove Copilot chat, deploy to GCC."; tdvsp_priority = 468510002; tdvsp_taskstatus = 468510005; tdvsp_tasktype = 468510001; tdvsp_date = "2026-04-13" },
    @{ tdvsp_name = "Finish Copilot Studio fundamentals path"; tdvsp_description = "MS Learn path for Copilot Studio. Completed all modules and hands-on labs."; tdvsp_priority = 468510001; tdvsp_taskstatus = 468510005; tdvsp_tasktype = 468510002; tdvsp_date = "2026-04-10" },
    @{ tdvsp_name = "Read GCC compliance whitepaper"; tdvsp_description = "FedRAMP High authorization documentation for Power Platform GCC. Needed for customer conversations."; tdvsp_priority = 468510003; tdvsp_taskstatus = 468510005; tdvsp_tasktype = 468510002; tdvsp_date = "2026-04-08" }
)

$actionItems = @{}
foreach ($ai in $actionItemData) {
    $body = @{
        tdvsp_name       = $ai.tdvsp_name
        tdvsp_priority   = $ai.tdvsp_priority
        tdvsp_taskstatus = $ai.tdvsp_taskstatus
        tdvsp_tasktype   = $ai.tdvsp_tasktype
    }
    if ($ai.tdvsp_description) { $body["tdvsp_description"] = $ai.tdvsp_description }
    if ($ai.tdvsp_date) { $body["tdvsp_date"] = $ai.tdvsp_date }
    if ($ai.account) {
        $acctId = $accounts[$ai.account]
        $body["tdvsp_Customer@odata.bind"] = "/accounts($acctId)"
    }
    $result = New-Record -EntitySet "tdvsp_actionitems" -Body $body
    $id = $result.tdvsp_actionitemid
    $actionItems[$ai.tdvsp_name] = $id
    Write-Host "  Created action item: $($ai.tdvsp_name) -> $id" -ForegroundColor Gray
}

# ============================================================
# 5. MEETING SUMMARIES (10 meetings, linked to accounts)
# ============================================================
Write-Host "`n=== Creating Meeting Summaries ===" -ForegroundColor Yellow

$meetingData = @(
    @{ tdvsp_name = "Philly 311 Pilot Kickoff"; tdvsp_date = "2026-03-15"; account = "City of Philadelphia"; tdvsp_summary = "Kicked off the 311 AI chatbot pilot with Dana Rivera and Marcus Chen. Agreed on 90-day timeline. Phase 1: trash pickup and pothole reporting. Success metric: 40% call deflection. Dana wants weekly status updates. Marcus to provide API access to 311 system by March 22. Budget approved for 3 Copilot Studio licenses." },
    @{ tdvsp_name = "PA Benefits Modernization Discovery"; tdvsp_date = "2026-03-28"; account = "Commonwealth of Pennsylvania"; tdvsp_summary = "Discovery session with Sarah Kim and Roberto Garcia. Current system is COBOL on mainframe, 30+ years old. 2.3M benefit applications per year. Key pain: manual document review takes 45 min per application. Roberto showed us sample forms - very inconsistent formatting. AI Builder form processing looks promising. Sarah wants architecture proposal by April 25." },
    @{ tdvsp_name = "LA County Emergency Mgmt Requirements"; tdvsp_date = "2026-04-02"; account = "Los Angeles County"; tdvsp_summary = "Requirements gathering with Kevin Nakamura and Tanya Brooks. Need real-time dashboard for: active incidents, resource deployment, shelter capacity, road closures. Data sources: CAD system (API), NWS weather (RSS), traffic cameras (RTSP), social media (Twitter API). Kevin insists on under 30 second data refresh. Tanya needs role-based access for 200+ users across departments." },
    @{ tdvsp_name = "TX SNAP Automation Planning"; tdvsp_date = "2026-04-05"; account = "State of Texas HHS"; tdvsp_summary = "Planning session with Miguel Santos and Linda Tran. Current SNAP processing: 30 days average, target 7 days. 1.8M households served. Key automation targets: document intake (AI Builder), eligibility pre-screening (Power Automate), caseworker assignment (model-driven app). Linda flagged FedRAMP requirements - need GCC environment. Miguel to send anonymized sample data by April 15." },
    @{ tdvsp_name = "Chicago Smart City RFI Discussion"; tdvsp_date = "2026-04-08"; account = "City of Chicago"; tdvsp_summary = "Reviewed Chicago's smart city RFI with DeShawn Williams. They want IoT sensor management, predictive maintenance for infrastructure, and a resident-facing dashboard. 50K+ sensors planned across water, traffic, and environmental monitoring. DeShawn interested in Power Platform for the operational layer. Emily O'Brien joining next call to discuss the resident portal requirements." },
    @{ tdvsp_name = "Maryland CoE Strategy Session"; tdvsp_date = "2026-04-10"; account = "Maryland Department of IT"; tdvsp_summary = "Strategy session with Raj Mehta and Fatima Al-Rashid. Goal: 500 makers in Year 1, 50 production apps. Current state: ~30 makers, no governance. Proposed: 3 environment types (dev/test/prod), DLP policy tiers, monthly maker office hours, quarterly app reviews. Fatima wants to pilot with 3 agencies first. Raj to set up the shared Azure AD security groups." },
    @{ tdvsp_name = "Maricopa Records Portal Workshop"; tdvsp_date = "2026-04-11"; account = "Maricopa County"; tdvsp_summary = "Half-day workshop with Chris Dawson, Angela Foster, and Tom Reeves. Mapped the public records request workflow: submit -> acknowledge -> route -> gather -> review -> redact -> approve -> deliver. Average 200 requests/month, 15 business day SLA (currently missing 30% of the time). Angela showed us the current SharePoint-based system - very manual. Power Pages + Power Automate can automate most of the routing and tracking." },
    @{ tdvsp_name = "NY ITS Copilot Studio Deep Dive"; tdvsp_date = "2026-04-12"; account = "New York State ITS"; tdvsp_summary = "Technical deep dive with Sophie Goldstein and David Park. Showed them multi-topic agent with Dataverse knowledge base. They were impressed by the generative answers capability. Sophie wants to build agents for: DMV appointment scheduling, tax filing status, and unemployment claims FAQ. David asked about the AI readiness assessment - I offered to send our framework. Need to set up GCC environment for their pilot." },
    @{ tdvsp_name = "SLG Team Weekly Sync"; tdvsp_date = "2026-04-12"; tdvsp_summary = "Weekly team sync. Reviewed pipeline: Philly (pilot running, on track), PA (discovery complete, proposal due), LA County (requirements in progress), TX HHS (planning phase), Chicago (RFI submitted), Maryland (CoE strategy approved), Maricopa (workshop done, architecture next), NY ITS (demo well received). Tim having issues deploying code app to GCC - needs the gccmoderate region fix. Discussed upcoming Ignite prep." },
    @{ tdvsp_name = "Code Apps Tech Series Prep"; tdvsp_date = "2026-04-13"; tdvsp_summary = "Prep call for the tech series presentation. Reviewed demo flow: show the code app running in GCC, walk through the architecture (Vite + React + Dataverse), demonstrate CRUD operations, dark mode, board view, command palette. Need to load sample data before the demo. Tim's portion: intro and overview. My portion: under the hood deep dive and live coding. Deck is ready in demo-materials/." }
)

foreach ($m in $meetingData) {
    $body = @{
        tdvsp_name    = $m.tdvsp_name
        tdvsp_date    = $m.tdvsp_date
        tdvsp_summary = $m.tdvsp_summary
    }
    if ($m.account) {
        $acctId = $accounts[$m.account]
        $body["tdvsp_Account@odata.bind"] = "/accounts($acctId)"
    }
    $result = New-Record -EntitySet "tdvsp_meetingsummaries" -Body $body
    Write-Host "  Created meeting: $($m.tdvsp_name) -> $($result.tdvsp_meetingsummaryid)" -ForegroundColor Gray
}

# ============================================================
# 6. IDEAS (12 ideas, linked to accounts and contacts)
# ============================================================
Write-Host "`n=== Creating Ideas ===" -ForegroundColor Yellow

$ideaData = @(
    @{ tdvsp_name = "Copilot Studio multi-language support for 311"; tdvsp_description = "Philly has 100+ languages spoken. Build a Copilot Studio agent that auto-detects language and responds in kind. Could be reusable across all SLG customers."; tdvsp_category = 468510000; account = "City of Philadelphia"; contact = "Priya Patel" },
    @{ tdvsp_name = "AI Builder for handwritten benefits forms"; tdvsp_description = "Many PA benefits applications are still handwritten. Train a custom AI Builder model on handwritten forms. Could dramatically speed up intake processing."; tdvsp_category = 468510006; account = "Commonwealth of Pennsylvania"; contact = "Roberto Garcia" },
    @{ tdvsp_name = "Canvas app for emergency field workers"; tdvsp_description = "Mobile canvas app for LA County field workers during emergencies. Offline-capable, GPS tracking, photo upload, status updates. Sync to Dataverse when back online."; tdvsp_category = 468510001; account = "Los Angeles County"; contact = "Kevin Nakamura" },
    @{ tdvsp_name = "Power Automate approval chains for SNAP"; tdvsp_description = "Multi-level approval workflow for SNAP eligibility decisions. Auto-escalation after 48 hours, audit trail, supervisor dashboard."; tdvsp_category = 468510003; account = "State of Texas HHS" },
    @{ tdvsp_name = "Azure AI Document Intelligence for records redaction"; tdvsp_description = "Use Azure AI Document Intelligence to auto-identify PII in public records and suggest redactions. Human reviews and approves. Could save Maricopa hours per request."; tdvsp_category = 468510005; account = "Maricopa County"; contact = "Angela Foster" },
    @{ tdvsp_name = "Power Pages citizen feedback portal template"; tdvsp_description = "Reusable Power Pages template for citizen feedback/survey collection. Authentication via Login.gov or state ID systems. Dataverse backend."; tdvsp_category = 468510004 },
    @{ tdvsp_name = "Model-driven app for grant management"; tdvsp_description = "Many SLG customers manage federal grants manually. Build a model-driven app with tracking, reporting, and compliance workflows."; tdvsp_category = 468510002 },
    @{ tdvsp_name = "MCP server for Dataverse"; tdvsp_description = "Build a reusable MCP (Model Context Protocol) server that wraps Dataverse CRUD operations. Would let Claude Code, Copilot Studio, and other AI tools interact with Dataverse natively."; tdvsp_category = 468510006 },
    @{ tdvsp_name = "PCF control for org chart visualization"; tdvsp_description = "Custom PCF control that renders org charts from Dataverse contact/account hierarchies. Drag-and-drop reorg capability."; tdvsp_category = 468510007 },
    @{ tdvsp_name = "GCC-to-Commercial data sync pattern"; tdvsp_description = "Document and build a reusable pattern for syncing non-sensitive data between GCC and commercial environments. Common need for customers with hybrid deployments."; tdvsp_category = 468510008 },
    @{ tdvsp_name = "Copilot Studio agent for IT helpdesk"; tdvsp_description = "NY ITS wants a Copilot Studio agent for internal IT helpdesk. Password resets, VPN troubleshooting, software requests. Could template this for other states."; tdvsp_category = 468510000; account = "New York State ITS"; contact = "Sophie Goldstein" },
    @{ tdvsp_name = "Azure OpenAI meeting summarizer for SLG"; tdvsp_description = "Build a Power Automate flow that takes Teams meeting transcripts, runs them through Azure OpenAI, and creates Dataverse meeting summary records automatically."; tdvsp_category = 468510005 }
)

foreach ($idea in $ideaData) {
    $body = @{
        tdvsp_name     = $idea.tdvsp_name
        tdvsp_category = $idea.tdvsp_category
    }
    if ($idea.tdvsp_description) { $body["tdvsp_description"] = $idea.tdvsp_description }
    if ($idea.account) {
        $acctId = $accounts[$idea.account]
        $body["tdvsp_Account@odata.bind"] = "/accounts($acctId)"
    }
    if ($idea.contact) {
        $contactId = $contacts[$idea.contact]
        $body["tdvsp_Contact@odata.bind"] = "/contacts($contactId)"
    }
    $result = New-Record -EntitySet "tdvsp_ideas" -Body $body
    Write-Host "  Created idea: $($idea.tdvsp_name) -> $($result.tdvsp_ideaid)" -ForegroundColor Gray
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  SEED DATA COMPLETE" -ForegroundColor Green
Write-Host "  Accounts:         $($accounts.Count)" -ForegroundColor White
Write-Host "  Contacts:         $($contacts.Count)" -ForegroundColor White
Write-Host "  Projects:         $($projects.Count)" -ForegroundColor White
Write-Host "  Action Items:     $($actionItems.Count)" -ForegroundColor White
Write-Host "  Meeting Summaries: $($meetingData.Count)" -ForegroundColor White
Write-Host "  Ideas:            $($ideaData.Count)" -ForegroundColor White
Write-Host "  TOTAL RECORDS:    $($accounts.Count + $contacts.Count + $projects.Count + $actionItems.Count + $meetingData.Count + $ideaData.Count)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
