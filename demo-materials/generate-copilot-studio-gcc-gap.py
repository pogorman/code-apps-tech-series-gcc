"""
Generates demo-materials/copilot-studio-gcc-gap.pdf

A technical brief documenting the gap between commercial and GCC for the
Microsoft Copilot Studio connector in Power Apps Code Apps. Follows the same
fpdf2 pattern as generate-deck.py.

Usage:
    pip install fpdf2
    python demo-materials/generate-copilot-studio-gcc-gap.py
"""

import os
from fpdf import FPDF


OUT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_PATH = os.path.join(OUT_DIR, "copilot-studio-gcc-gap.pdf")


# Microsoft blue primary, neutral text, error red for failure evidence
MSFT_BLUE = (0, 120, 212)
MSFT_DARK = (12, 35, 64)
TEXT = (45, 45, 55)
SUBTLE = (115, 115, 130)
ERROR = (196, 48, 43)
SUCCESS = (16, 137, 62)
CODE_BG = (245, 247, 250)


def build_pdf():
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(25, 20, 25)

    pdf.add_font("Segoe", "", "C:/Windows/Fonts/segoeui.ttf", uni=True)
    pdf.add_font("Segoe", "B", "C:/Windows/Fonts/segoeuib.ttf", uni=True)
    pdf.add_font("Segoe", "I", "C:/Windows/Fonts/segoeuii.ttf", uni=True)
    pdf.add_font("Consolas", "", "C:/Windows/Fonts/consola.ttf", uni=True)
    pdf.add_font("Consolas", "B", "C:/Windows/Fonts/consolab.ttf", uni=True)

    def h1(text, size=20):
        pdf.set_font("Segoe", "B", size)
        pdf.set_text_color(*MSFT_BLUE)
        pdf.cell(0, 11, text, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

    def h2(text, size=14):
        pdf.ln(2)
        pdf.set_font("Segoe", "B", size)
        pdf.set_text_color(*MSFT_DARK)
        pdf.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

    def h3(text, size=11):
        pdf.set_font("Segoe", "B", size)
        pdf.set_text_color(*MSFT_DARK)
        pdf.cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")

    def body(text, size=10):
        pdf.set_font("Segoe", "", size)
        pdf.set_text_color(*TEXT)
        pdf.multi_cell(0, 5.2, text)
        pdf.ln(1.5)

    def muted(text, size=9):
        pdf.set_font("Segoe", "I", size)
        pdf.set_text_color(*SUBTLE)
        pdf.multi_cell(0, 4.8, text)
        pdf.ln(1)

    def bullet(text, size=10):
        pdf.set_font("Segoe", "", size)
        pdf.set_text_color(*TEXT)
        # bullet in its own fixed-width cell, body wraps after
        start_x = pdf.get_x()
        pdf.cell(5, 5.2, "\u2022")
        pdf.multi_cell(0, 5.2, text)
        pdf.set_x(start_x)
        pdf.ln(0.3)

    def code_block(text, size=8.5):
        pdf.ln(1)
        pdf.set_font("Consolas", "", size)
        pdf.set_text_color(*MSFT_DARK)
        pdf.set_fill_color(*CODE_BG)
        pdf.multi_cell(0, 4.8, text, fill=True)
        pdf.ln(2)

    def error_block(text, size=9):
        pdf.ln(1)
        pdf.set_font("Consolas", "", size)
        pdf.set_text_color(*ERROR)
        pdf.set_fill_color(253, 240, 238)
        pdf.multi_cell(0, 4.8, text, fill=True)
        pdf.ln(2)

    def success_line(text, size=10):
        pdf.set_font("Segoe", "B", size)
        pdf.set_text_color(*SUCCESS)
        pdf.cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

    def fail_line(text, size=10):
        pdf.set_font("Segoe", "B", size)
        pdf.set_text_color(*ERROR)
        pdf.cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

    def rule(color=MSFT_BLUE):
        pdf.ln(2)
        pdf.set_draw_color(*color)
        pdf.set_line_width(0.4)
        y = pdf.get_y()
        pdf.line(25, y, 185, y)
        pdf.ln(4)

    # ════════════════════════════════════════════════════════════════════
    # PAGE 1 — COVER + EXECUTIVE SUMMARY
    # ════════════════════════════════════════════════════════════════════
    pdf.add_page()

    # Accent bar at top
    pdf.set_fill_color(*MSFT_BLUE)
    pdf.rect(0, 0, 210, 4, "F")
    pdf.ln(6)

    pdf.set_font("Segoe", "B", 22)
    pdf.set_text_color(*MSFT_BLUE)
    pdf.cell(0, 12, "Microsoft Copilot Studio Connector",
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Segoe", "B", 18)
    pdf.cell(0, 10, "GCC vs. Commercial Gap Analysis",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    pdf.set_font("Segoe", "", 11)
    pdf.set_text_color(*SUBTLE)
    pdf.cell(0, 6, "Power Apps Code Apps  \u2022  og-code (GCC moderate, crm9)  \u2022  April 2026",
             new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Prepared by Patrick O'Gorman, Microsoft AI Solution Engineer",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    rule()

    h2("Executive Summary")
    body(
        "Microsoft's documented \"native\" path to embed a Copilot Studio agent in a Power Apps "
        "Code App uses the Microsoft Copilot Studio connector "
        "(shared_microsoftcopilotstudio) and a generated TypeScript client that calls "
        "ExecuteCopilotAsyncV2. We verified this path works end-to-end in a commercial Power "
        "Platform tenant with a single command and zero custom auth code."
    )
    body(
        "Executing the same approach in a GCC tenant (og-code, crm9.dynamics.com) fails at the "
        "very first step \u2014 creating the connection in the GCC maker portal. The failure is "
        "an identity-plane error (AADSTS700030, \"Invalid certificate \u2013 the issuer of the "
        "certificate is from a different cloud instance\"), which indicates the connector's "
        "backend First Party Azure AD identity is presenting a commercial-cloud-issued "
        "certificate to GCC Entra ID. This is a Microsoft-side provisioning gap in GCC, not a "
        "tenant configuration issue, and consistent with the broader pattern that new Power "
        "Platform connectors ship to commercial first and reach GCC parity on a lag."
    )
    body(
        "There is no documented or undocumented CLI escape hatch \u2014 Microsoft Learn "
        "explicitly states the connection \"must be created through the Power Apps maker portal "
        "UI,\" and the UI is the broken client. The working interim path for this repo is the "
        "existing popup-window integration (phase 12) which authenticates via the native "
        "Copilot Studio webchat URL and does not depend on the connector. A Power Automate "
        "detour is the fallback if deeper in-app chat is required before Microsoft ships a fix."
    )

    h2("Key Facts")
    bullet("Commercial: connector + Code App integration works end-to-end.")
    bullet("GCC: same steps fail at \"Create connection\" in the maker portal.")
    bullet("Error: AADSTS700030, First Party OAuth2 Certificate flow, invalid_client.")
    bullet("Root cause: connector's First Party AAD identity not provisioned for GCC Entra ID.")
    bullet("CLI fallback: none. pac connection create is Dataverse-only.")
    bullet("Workaround: popup-window integration (current) or Power Automate detour.")

    # ════════════════════════════════════════════════════════════════════
    # PAGE 2 — THE MICROSOFT-RECOMMENDED PATH
    # ════════════════════════════════════════════════════════════════════
    pdf.add_page()
    h1("1. The Microsoft-Recommended Path")

    body(
        "Microsoft Learn's article \"How to: Connect your code app to Microsoft Copilot "
        "Studio agents\" describes a clean, supported integration: the Copilot Studio connector "
        "is added as a data source to the Code App, which auto-generates a typed TypeScript "
        "service and model. The Code App then calls ExecuteCopilotAsyncV2 to invoke the agent "
        "synchronously and receive the response directly in React code. Authentication flows "
        "from the Power Apps host session \u2014 no Direct Line, no MSAL, no token exchange, no "
        "iframe, no webchat widget."
    )

    h3("Documented steps")
    bullet("Publish the Copilot Studio agent with Microsoft (Entra ID) authentication.")
    bullet("Copy the agent schema name from Settings \u2192 Advanced \u2192 Metadata "
           "(case-sensitive, includes publisher prefix, e.g. cr3e1_customerSupportAgent).")
    bullet("Create a Microsoft Copilot Studio connection from the Power Apps maker portal "
           "(the article explicitly states: \"you must create one through the Power Apps maker "
           "portal UI\").")
    bullet("Add the connector as a Code App data source:")
    code_block('pac code add-data-source -a "shared_microsoftcopilotstudio" -c <connectionId>')
    bullet("Import the generated service and call the agent:")
    code_block(
        "import { MicrosoftCopilotStudioService } from\n"
        "  './generated/services/MicrosoftCopilotStudioService';\n\n"
        "const response = await MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2(\n"
        "  AGENT_SCHEMA_NAME,\n"
        "  {\n"
        "    notificationUrl: 'https://notificationurlplaceholder',\n"
        "    message: userInput,\n"
        "  },\n"
        "  conversationId // optional, for multi-turn\n"
        ");"
    )

    h3("Why the pattern is attractive")
    bullet("No Direct Line secret, no MSAL SSO exchange, no custom tokens in React.")
    bullet("End-user Entra identity inherits from the Code App host automatically.")
    bullet("Multi-turn conversations via a persisted conversationId round-trip.")
    bullet("Typed TypeScript client regenerates deterministically from the connector schema.")
    bullet("Chat UI lives fully inside the Code App \u2014 not a popup, not an iframe.")

    h3("Reference")
    muted("Microsoft Learn: How to: Connect your code app to Microsoft Copilot Studio agents")
    muted("learn.microsoft.com/power-apps/developer/code-apps/how-to/connect-to-copilot-studio")
    muted("Notably: this article has no GCC section, and every agent URL example uses the "
          "commercial hostname {id}.environment.api.powerplatform.com. First indication that "
          "the path was documented against commercial only.")

    # ════════════════════════════════════════════════════════════════════
    # PAGE 3 — WHAT HAPPENS IN COMMERCIAL
    # ════════════════════════════════════════════════════════════════════
    pdf.add_page()
    h1("2. What Happens in Commercial Cloud")
    success_line("Verified working end-to-end in a commercial Power Platform tenant.")

    body(
        "Running the documented path in a standard commercial tenant produces the expected "
        "result at every step. The maker portal creates the Copilot Studio connection without "
        "error. pac code add-data-source generates the service and model files. The generated "
        "client can be imported and called from a React component, with responses flowing back "
        "from the published Copilot Studio agent on the first try."
    )

    h3("Observed behavior in the commercial sibling implementation")
    bullet("pac connection list shows the shared_microsoftcopilotstudio connection in "
           "Connected state immediately after creation from the maker portal.")
    bullet("pac code add-data-source completes successfully and writes:")
    code_block(
        "src/generated/services/MicrosoftCopilotStudioService.ts\n"
        "src/generated/models/MicrosoftCopilotStudioModel.ts\n"
        ".power/schemas/microsoftcopilotstudio/microsoftcopilotstudio.Schema.json"
    )
    bullet("A floating chat panel built on top (copilot-chat-panel.tsx) calls "
           "ExecuteCopilotAsyncV2 and receives a populated response with multi-turn support. "
           "The Power Apps host session provides the Entra identity \u2014 there is zero token "
           "code in the component.")

    h3("Implementation notes worth preserving for the GCC re-enable day")
    body(
        "These details were discovered during the working commercial build and are not in the "
        "public Microsoft Learn article. They apply when the connector is eventually unblocked "
        "for GCC:"
    )
    bullet("Call signature is POSITIONAL, not named-object. The generated method is "
           "ExecuteCopilotAsyncV2(agentName, body, conversationId?). The inbox note that "
           "started this investigation suggested a single named-object arg, which is wrong \u2014 "
           "that was a paraphrase of the REST shape, not the generated TypeScript shape.")
    bullet("The request body field is 'message', not 'text'. Confirmed by inspecting "
           ".power/schemas/microsoftcopilotstudio/microsoftcopilotstudio.Schema.json after "
           "pac code add-data-source wrote it.")
    bullet("The generated TypeScript return type is 'void', but the runtime response actually "
           "resolves to { lastResponse, responses[], conversationId }. Client code should read "
           "lastResponse first, fall back to joining responses[], then finally to the original "
           "message, to guard against empty fields.")
    bullet("notificationUrl is a required field but is ignored in synchronous mode. Pass the "
           "literal placeholder 'https://notificationurlplaceholder' per Microsoft Learn.")

    h3("Why this matters for the gap analysis")
    body(
        "The commercial run is the control case. Same pac CLI, same connector, same command, "
        "same user identity pattern, same agent topology. It works in commercial. It fails in "
        "GCC. That rules out bugs in the command, the connector schema, the agent, the Code "
        "App scaffold, or the user flow \u2014 the only remaining variable is the cloud the "
        "tenant lives in, which points squarely at GCC-side identity provisioning."
    )

    # ════════════════════════════════════════════════════════════════════
    # PAGE 4 — WHAT HAPPENS IN GCC
    # ════════════════════════════════════════════════════════════════════
    pdf.add_page()
    h1("3. What Happens in GCC (og-code)")
    fail_line("Fails at the first step: creating the connection in the maker portal.")

    body(
        "The documented path cannot be started in GCC because step 1 \u2014 creating the "
        "Microsoft Copilot Studio connection \u2014 returns a hard error. The connector card "
        "does appear in the GCC maker portal's connection picker, which masks the gap until "
        "Create is clicked."
    )

    h3("Reproduction steps (GCC)")
    bullet("Open make.gov.powerautomate.us and confirm the tenant is og-code "
           "(crm9.dynamics.com, GCC moderate).")
    bullet("Navigate: Connections \u2192 + New connection \u2192 search \"Copilot Studio\" "
           "\u2192 Microsoft Copilot Studio \u2192 Create.")
    bullet("Authentication dialog opens (\"Connect to Microsoft Copilot Studio\"), then "
           "immediately returns a red banner error.")

    h3("The error")
    error_block(
        "OAuth2Certificate Authorization Flow failed for service First Party\n"
        "Azure Active Directory. Failed to acquire token from AAD:\n\n"
        "{\n"
        '  "error": "invalid_client",\n'
        '  "error_description": "AADSTS700030: Invalid certificate -\n'
        '    the issuer of the certificate is from a different cloud\n'
        '    instance."\n'
        "}\n\n"
        "Correlation ID: f6f4fc79-9b04-4e82-8a94-7769d34158e2\n"
        "Trace ID:       b8e3d367-4a88-4a21-bd26-1ff362397000\n"
        "Timestamp:      2026-04-14 03:09:02Z\n"
        "Portal:         make.gov.powerautomate.us\n"
        "Tenant:         og-code (crm9.dynamics.com, GCC moderate)\n"
        "Connector:      shared_microsoftcopilotstudio"
    )
    muted("Screenshot evidence: inbox/copilot-studio-connection-bug-in-gcc.png")

    h3("What this is not")
    bullet("Not a user-permission issue. The same user has the Dataverse connector connected "
           "in the same environment and can use every other connector listed in the maker "
           "portal.")
    bullet("Not a tenant-wide auth problem. DeviceCodeCredential authenticates against "
           "login.microsoftonline.us cleanly, the Code App itself runs and publishes, and "
           "Dataverse metadata writes round-trip successfully.")
    bullet("Not an agent configuration issue. The connection fails before any agent is "
           "selected \u2014 the Create dialog never gets to the agent-picker step.")
    bullet("Not a portal URL mismatch. The browser is on make.gov.powerautomate.us (correct "
           "GCC maker portal), not the commercial make.powerapps.com.")

    # ════════════════════════════════════════════════════════════════════
    # PAGE 5 — DIAGNOSIS
    # ════════════════════════════════════════════════════════════════════
    pdf.add_page()
    h1("4. Diagnosis: Why the Error Is a Microsoft-Side Gap")

    h3("What AADSTS700030 means")
    body(
        "AADSTS700030 is Azure AD's rejection code for \"Invalid certificate \u2014 the issuer "
        "of the certificate is from a different cloud instance.\" It surfaces when a "
        "certificate-based token request presents a certificate whose issuing authority belongs "
        "to a different Azure cloud from the one the token is being requested against."
    )
    body(
        "In concrete terms: the \"Create connection\" dialog triggers the Power Platform "
        "connections backend to run an OAuth2Certificate Authorization Flow against First "
        "Party Azure Active Directory, on behalf of the Microsoft Copilot Studio connector's "
        "backend identity. That identity is supposed to authenticate itself to the Gov Entra ID "
        "authority (login.microsoftonline.us) using a certificate whose issuer is Microsoft's "
        "Gov certificate authority. Instead, it is presenting a certificate issued by the "
        "commercial-cloud authority. Gov AAD sees \"this cert is from a different cloud\" and "
        "rejects the token request with invalid_client."
    )

    h3("What this implies")
    bullet("The connector's First Party app registration for GCC either does not exist or has "
           "not been enrolled with a Gov-issued certificate.")
    bullet("The backend runtime that brokers connection creation is hard-coded to use the "
           "commercial cert for this connector, regardless of which cloud the request "
           "originates from.")
    bullet("Either way, it is a Microsoft-side provisioning / deployment gap. No amount of "
           "tenant configuration, web role adjustment, policy change, or connector-reference "
           "manipulation on the customer side can alter the certificate that the connector's "
           "backend identity presents.")

    h3("Evidence that this is not a one-off")
    bullet("Microsoft Learn's Code App \u2192 Copilot Studio integration article has no GCC "
           "section. Every URL example uses the commercial hostname "
           "{id}.environment.api.powerplatform.com \u2014 not the GCC equivalent "
           "{id}.environment.api.gov.powerplatform.us. The documentation itself was produced "
           "against commercial only, suggesting the path was never validated in GCC.")
    bullet("Copilot Studio's own GCC documentation (requirements-licensing-gcc) confirms GCC "
           "has dedicated endpoints \u2014 gcc.powerva.microsoft.us and "
           "gcc.api.powerva.microsoft.us \u2014 and a reduced connector payload limit "
           "(450 KB in GCC vs. 5 MB in commercial). Microsoft clearly knows GCC exists for the "
           "service, but the Code App connector story has not caught up.")
    bullet("The \"GCC is a quarter behind commercial\" pattern is well-known across Power "
           "Platform and Microsoft 365 feature rollouts. New connectors, new services, and new "
           "SDK surfaces typically land in commercial first, then GCC, then GCC High, then DoD. "
           "A connector that was published to the GCC gallery UI but whose backend First Party "
           "identity was not enrolled in Gov Entra ID is a textbook example of that lag.")

    h3("Why the UI looking half-working is actually the bug")
    body(
        "The connector card ships globally because the connector swagger is published globally. "
        "That is why it appears in the GCC maker portal's picker. The swagger describing the "
        "connector is cheap to replicate; the backend First Party identity is not. When the "
        "deployment pipeline publishes the swagger before enrolling the identity in the target "
        "cloud, customers see a card that looks ready but breaks at first token request. That "
        "is exactly what this error pattern indicates."
    )

    # ════════════════════════════════════════════════════════════════════
    # PAGE 6 — WHAT I TRIED TO ROUTE AROUND IT
    # ════════════════════════════════════════════════════════════════════
    pdf.add_page()
    h1("5. What I Tried to Route Around It")

    h3("PAC CLI surface area")
    body(
        "Because the UI is the supported client for creating this connection, I checked every "
        "adjacent CLI path to see whether a different client could slip past the UI-layer bug. "
        "None of them apply."
    )
    code_block(
        "$ pac connection help\n"
        "Commands: create, delete, list, update\n"
        "\n"
        "$ pac connection create help\n"
        "Create new Dataverse connection.\n"
        "  --tenant-id, --name, --application-id, --client-secret\n"
        "\n"
        "$ pac code help\n"
        "(Preview) Commands: add-data-source, delete-data-source,\n"
        "  init, list, list-connection-references, list-datasets,\n"
        "  list-sql-stored-procedures, list-tables, push, run\n"
        "(no connection create subcommand)\n"
        "\n"
        "$ pac connection list\n"
        "# only shared_commondataserviceforapps, no Copilot Studio entry"
    )
    bullet("pac connection create is Dataverse-only and service-principal-only. It takes "
           "--application-id and --client-secret and creates a Dataverse-auth connection. "
           "There is no --api-id parameter for generic Power Platform connectors.")
    bullet("pac code has no connection-management subcommand at all \u2014 it operates on "
           "connections that already exist.")
    bullet("Microsoft Learn states explicitly: \"If you don't have an existing connection, "
           "you must create one through the Power Apps maker portal UI.\" The UI IS the "
           "supported client. There is no sanctioned non-UI path.")
    body(
        "Any client that initiates the same OAuth2Certificate Authorization Flow will hit the "
        "same AADSTS700030 \u2014 the UI is not a UI-layer bug wrapping a working backend, it "
        "is a thin shell over the broken backend flow. Using a different client does not help."
    )

    h3("Workarounds that do work")
    h3("   Option A \u2014 Keep the popup-window integration (current default)")
    body(
        "This repo already ships a working Copilot Studio integration from phase 12 in "
        "src/components/copilot-chat.tsx: a floating button that opens the native Copilot "
        "Studio webchat URL via window.open(). The agent authenticates itself in that popup "
        "window against its own GCC endpoint (gcc.powerva.microsoft.us). No connector, no CLI "
        "data source, no generated service. It works today and is the current demo default."
    )

    h3("   Option B \u2014 Power Automate detour")
    body(
        "If a deeper in-app chat experience is required before Microsoft ships a fix, "
        "substitute the broken connector with a Power Automate flow in the middle:"
    )
    bullet("Code App calls an instant or HTTP-triggered flow via the Power Apps for Makers "
           "connector (which does work in GCC).")
    bullet("The flow uses the \"Send a message to Copilot Studio agent\" Power Automate "
           "action against the same agent.")
    bullet("The flow returns the agent's response to the Code App.")
    body(
        "Power Automate's GCC runtime handles token acquisition through a different backend "
        "identity path than the connector creation dialog, so it sidesteps the broken flow "
        "entirely. The trade-off: you lose the typed ExecuteCopilotAsyncV2 client, responses "
        "are async round-trips through flow, and the Power Automate license cost applies."
    )

    h3("   Option C \u2014 Wait for Microsoft")
    body(
        "Given how cleanly the error narrates the root cause, this is fixable on the Microsoft "
        "side with no customer action. A support ticket referencing AADSTS700030, the "
        "correlation ID, the connector API ID, and the tenant is likely the fastest path to "
        "closure."
    )

    # ════════════════════════════════════════════════════════════════════
    # PAGE 7 — HOW TO ARTICULATE + SUPPORT TICKET LANGUAGE
    # ════════════════════════════════════════════════════════════════════
    pdf.add_page()
    h1("6. How to Articulate This")

    h3("To a customer or stakeholder")
    body(
        "Microsoft documents a clean native integration between Power Apps Code Apps and "
        "Copilot Studio agents. We verified it works end-to-end in a commercial Power Platform "
        "tenant. The same steps fail in GCC because the connector's backend identity has not "
        "been provisioned in Gov Entra ID yet \u2014 a gap on Microsoft's side, consistent "
        "with how new Power Platform capabilities typically reach GCC on a lag. The error is "
        "an identity-plane certificate rejection (AADSTS700030), which is unambiguous about "
        "the root cause. Our app currently uses a popup-window integration that does not "
        "depend on the connector and therefore works today in GCC; the native path becomes "
        "available to this app the day Microsoft enrolls the connector's backend identity in "
        "Gov Entra ID."
    )

    h3("To a Microsoft internal audience")
    body(
        "The shared_microsoftcopilotstudio connector card is surfaced in the GCC maker portal "
        "but the First Party OAuth2Certificate Authorization Flow for connection creation "
        "returns AADSTS700030 \u2014 the connector's backend identity presents a commercial-"
        "cloud-issued certificate to Gov Entra ID. The Code App \u2192 Copilot Studio Learn "
        "article has no GCC section and uses commercial URLs throughout. Commercial parity of "
        "the integration path is confirmed (we have a working commercial implementation); the "
        "GCC parity blocker is identity provisioning, not the connector definition. Request: "
        "enroll the connector's backend identity in Gov Entra ID (or equivalently, deploy the "
        "GCC-issued certificate on the existing backend) and re-validate the Code App \u2192 "
        "Copilot Studio path against a GCC tenant."
    )

    h3("Support ticket template")
    code_block(
        "Subject: shared_microsoftcopilotstudio connection creation\n"
        "         fails in GCC with AADSTS700030\n"
        "\n"
        "Environment: og-code (crm9.dynamics.com, GCC moderate)\n"
        "Tenant:      testtestmsftgccfo.onmicrosoft.com\n"
        "Portal:      make.gov.powerautomate.us\n"
        "Connector:   /providers/Microsoft.PowerApps/apis/\n"
        "             shared_microsoftcopilotstudio\n"
        "\n"
        "Repro:\n"
        "  1. Open make.gov.powerautomate.us as the tenant admin.\n"
        "  2. Connections -> New connection ->\n"
        "     Microsoft Copilot Studio -> Create.\n"
        "  3. Create dialog returns red banner error.\n"
        "\n"
        "Error:\n"
        "  OAuth2Certificate Authorization Flow failed for service\n"
        "  First Party Azure Active Directory. invalid_client.\n"
        "  AADSTS700030: Invalid certificate - the issuer of the\n"
        "  certificate is from a different cloud instance.\n"
        "\n"
        "Correlation ID: f6f4fc79-9b04-4e82-8a94-7769d34158e2\n"
        "Trace ID:       b8e3d367-4a88-4a21-bd26-1ff362397000\n"
        "\n"
        "Verified: same command, same connector, same agent pattern\n"
        "          works end-to-end in a commercial tenant with\n"
        "          pac code add-data-source -a\n"
        "          \"shared_microsoftcopilotstudio\".\n"
        "\n"
        "Ask: is the connector's First Party AAD identity provisioned\n"
        "     for GCC Entra ID? AADSTS700030 indicates the backend is\n"
        "     presenting a commercial-cloud cert to Gov AAD.\n"
        "\n"
        "Documentation reference:\n"
        "  learn.microsoft.com/power-apps/developer/code-apps/\n"
        "  how-to/connect-to-copilot-studio\n"
        "  (no GCC section; all examples use commercial URLs)"
    )

    h3("References")
    muted("\u2022 Microsoft Learn: How to: Connect your code app to Microsoft Copilot "
          "Studio agents")
    muted("\u2022 Microsoft Learn: Copilot Studio for US Government customers "
          "(requirements-licensing-gcc)")
    muted("\u2022 Azure AD error reference: AADSTS700030")
    muted("\u2022 Evidence screenshot: inbox/copilot-studio-connection-bug-in-gcc.png")
    muted("\u2022 This repo: demo-materials/generate-copilot-studio-gcc-gap.py "
          "(generator for this PDF)")

    pdf.output(PDF_PATH)
    print(f"PDF saved: {PDF_PATH}")


if __name__ == "__main__":
    build_pdf()
