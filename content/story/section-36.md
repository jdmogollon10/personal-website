---
title: Applied AI
# Same pattern as Independent Research: one project per scroll, or switch with the tabs.
# A project with `workflow` shows a native diagram instead of an image; its button opens
# the full sequence in the page. `href` is optional.
projects:
  - title: INTAKE | Finance Intelligence Hub
    tab: INTAKE
    body: "INTAKE brings the sources I follow into one place: finance news, recent M&A deals, market and company commentary from selected Substack writers, and my favorite finance podcasts. It also includes a daily market brief that Claude refreshes at 7 a.m., giving me a starting point for what to read and research each morning."
    image: /images/apps/intake.webp
    imageAlt: "INTAKE home screen: a grid of the latest market, deal, and research headlines from many sources, with sections for Daily Brief, M&A Deals, News, Macro & Credit, and more"
    href: https://jdmogollon10.github.io/intake-scratch/
    button: Open INTAKE
  - title: Valuation Workflow
    tab: Valuation Workflow
    body: I built a research and valuation workflow with Claude Skills to organize source documents, check claims against evidence, analyze a business, and carry the findings into a valuation.
    button: Explore the workflow
    # The compact preview shows each stage's `name`; the detail view shows everything.
    # kind: input (source documents) · step (a numbered workflow step) · file (a final deliverable)
    workflow:
      title: Equity Research Report Workflow
      stages:
        - name: Source materials
          items:
            - kind: input
              label: Inputs
              text: 10-Ks, 10-Qs, releases, transcripts, decks
            - kind: step
              num: "01"
              label: Source Intake
              text: What sources can I trust?
            - kind: step
              num: "02"
              label: Historicals
              text: Build clean historical financials
        - name: Business analysis
          items:
            - kind: step
              num: "03"
              label: Operating
              text: What changed in the business?
            - kind: step
              num: "04"
              label: Earnings Quality
              text: What is recurring vs unusual?
            - kind: step
              num: "05"
              label: Competitive
              text: Industry, competitors, peer set
        - name: Valuation
          items:
            - kind: step
              num: "06"
              label: Valuation
              text: DCF, comps, sensitivities
        - name: Research output
          items:
            - kind: step
              num: "07"
              label: Synthesis
              text: Key debates and what to investigate next
            - kind: file
              label: Research_Workbook.xlsx
              text: Summarized financials, valuation, and workbench
            - kind: file
              label: Equity_Research_Report.docx
              text: Executive research summary
            - kind: file
              label: Equity_Research_Report.pdf
              text: Same report, presentation-ready
---
I use AI to organize information, test ideas, and make my research process more useful.
