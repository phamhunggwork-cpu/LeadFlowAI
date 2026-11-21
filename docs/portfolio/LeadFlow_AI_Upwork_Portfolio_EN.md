<!--
Portfolio document: LeadFlow AI
English version translated from the original Vietnamese script.
The project scope, recommendations, examples, ratings, roadmap, and reference links are retained.
-->

# LeadFlow AI — AI-Powered Lead Qualification & CRM Automation

> A recommended n8n project for building an Upwork portfolio.

## Table of Contents

1. [Market Research and Why This Project Was Selected](#1-market-research-and-why-this-project-was-selected)
2. [Project Overview: LeadFlow AI](#2-project-overview-leadflow-ai)
3. [Recommended Technology Stack](#3-recommended-technology-stack)
4. [Technical Architecture](#4-technical-architecture)
5. [Database Design](#5-database-design)
6. [14-Day Implementation Roadmap](#6-14-day-implementation-roadmap)
7. [Testing Plan](#7-testing-plan)
8. [Turning the Project into a Strong Upwork Portfolio](#8-turning-the-project-into-a-strong-upwork-portfolio)
9. [Resources to Use During Implementation](#9-resources-to-use-during-implementation)
10. [Final Assessment and Recommended Next Steps](#10-final-assessment-and-recommended-next-steps)

---

I recommend building a project called:

## LeadFlow AI

**AI-Powered Lead Qualification & CRM Automation**

A system that automatically receives potential customer inquiries, uses AI to analyze their needs and assess their potential, updates the CRM, notifies the sales team, and helps send emails after human approval.

**Core technologies:** `n8n` · `AI Integration` · `REST API` · `Webhooks` · `CRM Automation` · `Supabase`

This is not simply an AI chatbot or an automated email-sending workflow. It simulates a real business process that an agency, consultancy, or service-based company could use.

I consider this the most suitable project for you to start building your n8n portfolio because its business value is easy to explain, while it also allows you to demonstrate important skills required for AI Automation & Integration jobs.

## 1. Market Research and Why This Project Was Selected

### What clients are looking for on Upwork

I compared several recent Upwork job postings with workflow templates available on n8n.

A few examples are particularly relevant to your goals:

**Job 1 — AI Automation & Integration Specialist**

A job posted on November 17, 2026, asked a freelancer to build end-to-end workflows for lead generation, lead qualification, CRM updates, appointment scheduling, order processing, and AI Agents capable of handing complex cases over to a human. The client required experience with n8n, Make, Zapier, OpenAI, Claude, and API integration.

> Reference: Upwork

**Job 2 — AI Lead Qualification and HubSpot CRM Automation**

A job posted approximately three weeks earlier required the freelancer to:

- Receive leads from CSV files or website forms.
- Use AI to classify leads as Qualified, Needs Review, or Not Qualified.
- Create or update contacts in HubSpot.
- Detect duplicate leads.
- Implement validation, error handling, and testing.
- Hand over the workflow together with usage instructions.

This is almost exactly the business problem I am recommending you build.

> Reference: Upwork

**Job 3 — n8n Lead Qualification & Follow-up**

Another job required the freelancer to receive data from website forms, Meta Ads, or webhooks; normalize the data; score leads using an LLM; synchronize records with a CRM; generate personalized emails; track lead statuses; and handle errors without losing leads.

> Reference: Upwork

Another n8n job also emphasized that the client wanted someone capable of independently designing a system, handling errors, deploying it in a self-hosted environment, and providing documentation—not simply connecting nodes.

> Reference: Upwork

**Important:** This is a sample based on several job postings, not a statistical analysis of the entire Upwork marketplace. However, the requirements recur often enough to provide a useful basis for designing a portfolio project.

### Comparing the project with n8n workflows

The official n8n use-case page describes Lead Management as four groups of activities:

1. **Capture** — Receive leads from forms, advertisements, or applications.
2. **Enrich** — Enrich and clean the data.
3. **Qualify** — Use AI to assess leads.
4. **Route** — Send leads to the appropriate person or next system.

> Reference: n8n

In addition, the n8n Marketplace already includes similar workflows, such as:

- [AI Lead Qualification & Routing with OpenAI, Slack and Airtable](https://n8n.io/workflows/9349-ai-powered-lead-qualification-and-routing-with-openai-slack-and-airtable/).
- [Lead Qualification and Routing with GPT-4o-mini, Google Sheets and HighLevel](https://n8n.io/workflows/9310-automate-lead-qualification-and-routing-with-gpt-4o-mini-google-sheets-and-highlevel-crm/).
- [Lead Nurturing via Email, WhatsApp, OpenAI and Google Sheets CRM](https://n8n.io/workflows/15616-nurture-leads-via-email-whatsapp-openai-and-google-sheets-crm/).

These templates show that the use case has practical applications and can be implemented with the current n8n ecosystem.

> Reference: n8n Workflow Templates

### Comparing project ideas

The scores below reflect how suitable each idea is for a first n8n portfolio project. They are not statistical measures of market demand.

| Project idea | Portfolio value | Difficulty | Assessment |
| --- | ---: | --- | --- |
| AI Lead Management & CRM | 9.5/10 | Intermediate–advanced | **Recommended** |
| AI Email & Customer Support Triage | 8.5/10 | Intermediate–advanced | Second project |
| AI Invoice & Document Processing | 8/10 | Advanced | Potential future project |
| AI Content Generation Pipeline | 6.5/10 | Beginner–intermediate | Relatively common |
| Simple FAQ Chatbot | 5.5/10 | Beginner | Not distinctive enough |

**Why not choose a simple AI chatbot?**

A chatbot usually demonstrates only the ability to connect an LLM, write prompts, and use a few tools. LeadFlow AI can demonstrate additional capabilities:

- Receiving and processing external data.
- Designing API integrations.
- Handling conditional logic.
- Storing and synchronizing data.
- Building AI workflows with structured outputs.
- Controlling AI actions.
- Handling errors and preventing duplicates.
- Designing maintainable workflows.

These capabilities are more closely aligned with the requirements of real-world automation jobs.

## 2. Project Overview: LeadFlow AI

### Simulated business scenario

Imagine that you are building a system for **Veloce Digital** — a 12-person, remote-first boutique web & software studio specializing in website design and software development.

Every day, the company receives numerous customer inquiries through its website. Employees must manually read each inquiry, review the budget, determine whether the prospect is a good fit, enter the information into the CRM, and send an email.

This manual process can consume employees' time and cause potential leads to be missed.

LeadFlow AI will automate this process.

### User-facing workflow

**1. A customer submits an inquiry**

Website form fields: name, email, company, optional phone, budget, timeline, project description, and email consent (`consent_to_email`).

**2. n8n receives and processes the inquiry**

`Validate → Normalize → Deduplicate → AI Analysis`

**3. AI analyzes the lead**

It assigns a score, classifies the lead, summarizes the customer's needs, and drafts a suggested email.

- **Qualified (75–100 points):** Prioritized for the sales team to review and approve outreach.
- **Needs Review (45–74 points or missing key information):** Requires additional manual review.
- **Not Qualified (< 45 points, out-of-scope, or spam):** Archived with no automated outreach.

**4. An employee reviews and approves the lead**

The employee reviews the information and the AI-generated email draft, then chooses Approve or Reject.

**5. The system sends the email and updates the CRM**

After approval, the system sends the email, records the activity history, and schedules a follow-up when appropriate.

### Features to build

| Feature | Description |
| --- | --- |
| Lead Capture | Receive website data through a webhook. |
| Data Validation | Check email addresses, required fields, and invalid data. |
| Data Normalization | Standardize emails, names, phone numbers, and incoming data. |
| Duplicate Detection | Prevent the same submission from being processed more than once. |
| AI Qualification | Analyze customer needs and classify prospects. |
| Lead Scoring | Assign scores based on business criteria. |
| CRM Integration | Create or update contacts in HubSpot. |
| Notification | Notify the team about important leads through Slack. |
| Human Approval | Require human approval before sending emails. |
| Email Automation | Send emails and conditional follow-ups. |
| Error Handling | Record errors and alert administrators. |
| Monitoring | Track workflow statuses. |

This version is broad enough to make a strong portfolio project without becoming a full-scale CRM product.

## 3. Recommended Technology Stack

I recommend making use of technologies you have worked with before rather than learning too many new technologies at once.

**n8n — Automation Engine**

Orchestrates all workflows, handles logic, and integrates APIs.

**React + TypeScript**

Powers the website form and lead-management dashboard.

**Node.js**

Acts as an intermediary API to receive requests and securely call n8n webhooks.

**Supabase / PostgreSQL**

Stores leads, statuses, processing history, and dashboard data.

**HubSpot CRM**

Provides real CRM integration for creating and updating contacts.

**OpenAI or Gemini API**

Analyzes inquiries, extracts information, and drafts emails.

**Slack**

Sends notifications to the sales team.

**Why use both Supabase and HubSpot?**

The two tools serve different purposes:

- Supabase is the primary data store for the demo application, including processing history, approval statuses, and automation activities.
- HubSpot demonstrates the ability to synchronize data with a third-party CRM that a client may already be using.

To reduce the initial complexity, you can build the entire system with Supabase first and add HubSpot later. However, I recommend including HubSpot in the final portfolio version.

## 4. Technical Architecture

This is the most important part. You should divide the project into smaller workflows instead of putting everything into one massive workflow.

### Workflow 01 — Lead Intake & Qualification

**Priority: Required**

This is the core workflow.

1. **Webhook Trigger** — Receive a POST request from the Node.js backend.
2. **Validate & Normalize** — Use Code / IF nodes to validate and normalize the data.
3. **Idempotency & Duplicate Check** — Check whether the submission has already been processed.
4. **AI Qualification** — Produce structured output containing the service type, customer needs, fit assessment, and email draft.
5. **Lead Scoring & Routing** — Calculate the score using predefined rules and branch with IF / Switch nodes.
6. **Supabase** — Store the data.
7. **HubSpot** — Synchronize the CRM.
8. **Slack Notification** — Notify employees about the lead and recommend an action.

**Important implementation details:**

1. Do not accept webhook data without validating it.
2. Normalize email addresses to lowercase and validate their format.
3. Use a unique `submission_id` to prevent the same webhook event from being processed repeatedly.
4. Do not let AI determine the entire score by itself. Use AI for extraction and classification, then calculate the score with JavaScript rules.

For example, the system could use the following scoring criteria:

| Criterion | Maximum score |
| --- | ---: |
| Fit with the company's services | 30 |
| Budget | 30 |
| Implementation timeline | 20 |
| Clarity of requirements | 20 |
| **Total** | **100** |

These are simulated rules intended to demonstrate that the scoring system can be adapted to a client's criteria. They are not an industry-standard formula.

### Workflow 02 — Human Approval & Email Sending

**Priority: Required**

AI can suggest email content, but it should not send the email immediately on its own.

Process:

1. Receive the analyzed lead from Workflow 01.
2. Save the email draft in Supabase.
3. Display the lead on the dashboard.
4. An employee opens the lead details and reviews the draft.
5. The employee clicks Approve or Reject.
6. The backend calls a dedicated n8n webhook.
7. n8n validates the approval request, updates the status, and sends the email if approved.

Approval and email delivery statuses are standardized per `LeadFlowAI.sql`:

- **`inquiries.approval_status`:** `not_required → pending → approved` (or `rejected`)
- **`email_messages.status`:** `draft → pending_approval → approved → queued → sent` (or `failed` / `cancelled`)

This demonstrates an important principle in AI Automation: **AI makes recommendations, while humans control actions that affect customers.**

The n8n documentation also explains Human-in-the-loop patterns, which require human approval before an AI Agent executes certain potentially risky tools, such as sending messages or modifying data.

> Reference: GitHub / n8n documentation

### Workflow 03 — Automated Follow-up

**Priority: Recommended for the portfolio version**

After a customer has been contacted, the system can automatically check which leads have not responded.

For example:

- After 24 hours: check whether the lead has replied.
- If there is no reply and the customer has consented to receive emails: send the first follow-up email.
- If the customer replies: stop the follow-up sequence.
- If the customer opts out of receiving emails: mark the contact as `unsubscribed` and stop all future emails.
- If the lead's status changes to Closed or Won: stop follow-ups.

You can use **Schedule Trigger + a Supabase query** to find leads that are due for follow-up. Alternatively, use the Wait node to pause a workflow and resume it after a specified period. The Wait node supports resuming based on time or a webhook call.

> Reference: GitHub / n8n documentation

Do not try to build an overly complex customer-nurturing sequence at the beginning. One follow-up with complete stopping conditions is enough to demonstrate the automation logic.

### Workflow 04 — Error Handling & Logging

**Priority: Required**

This is one of the elements that distinguishes a learning workflow from a workflow designed for real operations.

You need to account for situations such as:

- The OpenAI/Gemini API does not respond.
- HubSpot returns an authentication error.
- Supabase times out.
- AI returns output that does not match the JSON schema.
- The email API fails.
- A webhook is delivered multiple times.

Create a separate workflow that starts with an Error Trigger to:

1. Receive error details.
2. Identify the workflow and node where the error occurred.
3. Record the error in the `workflow_errors` table.
4. Send an alert to Slack.
5. Allow an administrator to investigate and retry the operation when it is safe.

The official n8n documentation explains how to use Error Trigger to create a shared error workflow for multiple workflows, and how to use execution history to investigate errors.

> Reference: GitHub / n8n documentation

**Note:** Retrying an operation does not automatically make error recovery safe. If an email is sent successfully but the subsequent database update fails, retrying the workflow may send the email twice. Therefore, you need processing statuses and idempotency mechanisms for individual actions.

## 5. Database Design

You can use Supabase/PostgreSQL.

The standardized schema consists of **6 tables** (aligned with `LeadFlowAI.sql`):

| Table | Purpose |
| --- | --- |
| `contacts` | Personal and company information. |
| `inquiries` | Project inquiries, budget/timeline data, consent, and lifecycle statuses. |
| `lead_analyses` | AI analysis results, qualification scores, and raw AI email draft snapshots (audit). |
| `email_messages` | Operational email drafts, approval/delivery statuses, and idempotency keys. |
| `activity_logs` | History of actions, approvals, and sent emails. |
| `workflow_errors` | Errors generated by n8n. |

Some important fields:

**`contacts`**

- `id`
- `full_name`
- `email` (unique after normalization: `LOWER(TRIM(email))`)
- `company_name`
- `phone`
- `hubspot_contact_id`

**`inquiries`**

- `id`
- `contact_id`
- `submission_id` (unique)
- `service_type`
- `budget_min`, `budget_max`, `budget_currency`
- `timeline_weeks`
- `project_description`
- `consent_to_email`, `consent_timestamp`, `consent_source`, `unsubscribed_at`
- `lead_status` (`new`, `processing`, `qualified`, `needs_review`, `not_qualified`, `contacted`, `replied`, `closed`, `won`)
- `priority` (`low`, `medium`, `high`)
- `approval_status` (`not_required`, `pending`, `approved`, `rejected`)
- `followup_status` (`not_eligible`, `scheduled`, `sent`, `stopped`)

**`lead_analyses`**

- `id`
- `inquiry_id`
- `model_name`, `prompt_version`
- `detected_service`
- `project_summary`
- `missing_information` (`JSONB`)
- `scope_fit` (`high`, `medium`, `low`)
- `spam_suspected`
- `qualification_score`, `qualification_status`, `priority`
- `draft_email` (original AI-generated draft snapshot for audit)

**`email_messages`**

- `id`
- `inquiry_id`
- `message_type` (`initial`, `follow_up`, `reply`, `other`)
- `direction` (`outbound`, `inbound`)
- `recipient_email`, `subject`, `body`
- `status` (`draft`, `pending_approval`, `approved`, `queued`, `sent`, `failed`, `cancelled`)
- `idempotency_key` (unique), `provider_message_id` (unique)
- `approved_by`, `approved_at`, `sent_at`

**`activity_logs`**

- `id`
- `inquiry_id`
- `event_type`
- `event_data` (`JSONB`)
- `created_at`

**`workflow_errors`**

- `id`
- `inquiry_id`, `submission_id`
- `workflow_name`, `execution_id`, `node_name`
- `error_message`
- `status` (`open`, `resolved`), `resolved_at`

`submission_id` should have a unique constraint so the system can detect repeated requests. One person may submit multiple project inquiries, so you should not use an email address as the unique key for every inquiry.

If you build a dashboard with user authentication, enable RLS and write appropriate policies. Supabase emphasizes that grants and RLS policies are separate layers of access control. The service role key can bypass RLS, so it must never be exposed in the browser.

> Reference: Supabase Docs

## 6. 14-Day Implementation Roadmap

I recommend allocating **3–4 hours per day**, for a total of approximately 42–56 hours. This plan is for a portfolio version with a basic dashboard and HubSpot integration, not a complete commercial CRM.

**Project progress tracker**

**Progress: 6/51 tasks**

### Day 1 — Define the business problem and requirements

**Progress: 3/3 tasks**

- [x] Write the simulated company profile and lead intake process.
- [x] Finalize the form fields and lead-scoring criteria.
- [x] Draw the data-flow diagram and define lead statuses.

> **Completion criteria:** Requirements document and flowchart are ready.

### Day 2 — Set up the environment

**Progress: 3/3 tasks**

- [x] Run n8n locally with Docker or use an existing instance.
- [x] Create a Supabase project and the initial tables.
- [x] Create a test form and a sample dataset of simulated leads.

> **Completion criteria:** The environment is running and the database is ready.

### Day 3 — Build Lead Intake

**Progress: 0/3 tasks**

- [ ] Create the React form.
- [ ] Create an intermediary Node API that securely calls the webhook.
- [ ] Create the Webhook Trigger in n8n.

> **Completion criteria:** Form submissions successfully reach the workflow.

### Day 4 — Validation and duplicate prevention

**Progress: 0/4 tasks**

- [ ] Validate required fields and email addresses.
- [ ] Normalize data with a Code node.
- [ ] Generate a `submission_id` and implement an idempotency check.
- [ ] Save the inquiry to Supabase.

> **Completion criteria:** Valid data is stored, and duplicate requests are not processed again.

### Day 5 — AI Qualification

**Progress: 0/4 tasks**

- [ ] Write the system prompt and extraction criteria.
- [ ] Connect the model API.
- [ ] Require AI to return output that follows a JSON schema.
- [ ] Validate and handle invalid output.

> **Completion criteria:** AI consistently returns structured results.

### Day 6 — Lead Scoring & Routing

**Progress: 0/3 tasks**

- [ ] Write the scoring rules in JavaScript.
- [ ] Create Qualified / Needs Review / Not Qualified branches.
- [ ] Save scores and explanations to the database.

> **Completion criteria:** Leads are classified according to the defined rules.

### Day 7 — HubSpot Integration

**Progress: 0/4 tasks**

- [ ] Set up the appropriate HubSpot developer/private app access.
- [ ] Configure the credentials in n8n.
- [ ] Create or update contacts using their email addresses.
- [ ] Check field mapping and API error handling.

> **Completion criteria:** Leads are synchronized with HubSpot.

### Day 8 — Slack Notifications

**Progress: 0/3 tasks**

- [ ] Create a Slack app or configure an appropriate webhook.
- [ ] Compose the notification message.
- [ ] Send alerts only for leads that meet the priority conditions.

> **Completion criteria:** Employees receive notifications containing the necessary information.

### Day 9 — Human Approval

**Progress: 0/4 tasks**

- [ ] Create a simple lead-review screen.
- [ ] Display the AI summary and email draft.
- [ ] Build the approve/reject endpoint.
- [ ] Authenticate the request before executing the action.

> **Completion criteria:** Users can review and approve leads through the dashboard.

### Day 10 — Email Automation

**Progress: 0/4 tasks**

- [ ] Connect an email provider.
- [ ] Send emails only after approval.
- [ ] Store email-sending history.
- [ ] Prevent the same email from being sent more than once.

> **Completion criteria:** Emails are sent and logged.

### Day 11 — Follow-up Automation

**Progress: 0/4 tasks**

- [ ] Create a scheduler to find leads that are due for follow-up.
- [ ] Check lead status, consent, and replies.
- [ ] Send one conditional follow-up email.
- [ ] Stop the sequence when a lead replies or unsubscribes.

> **Completion criteria:** Follow-ups work according to the defined conditions.

### Day 12 — Error Handling

**Progress: 0/4 tasks**

- [ ] Create an Error Trigger workflow.
- [ ] Record errors in Supabase.
- [ ] Send Slack alerts when errors occur.
- [ ] Test retries and action-level duplicate prevention.

> **Completion criteria:** Errors are recorded and recovery procedures are available.

### Day 13 — End-to-end system testing

**Progress: 0/4 tasks**

- [ ] Test valid leads, missing fields, and invalid email addresses.
- [ ] Test duplicates and repeated webhook deliveries.
- [ ] Test invalid AI output, API failures, and rejected approvals.
- [ ] Verify that emails are not sent without consent or approval.

> **Completion criteria:** A test report documents the results.

### Day 14 — Finalize the portfolio

**Progress: 0/4 tasks**

- [ ] Clean up the UI and demo data.
- [ ] Export workflow JSON files after removing sensitive information.
- [ ] Write the README and architecture diagram.
- [ ] Record a 60–90-second demo video.

> **Completion criteria:** The product, source files, and demo video are ready to showcase on Upwork.

### What you should not build during the first 14 days

To prevent the project from becoming unnecessarily large, I recommend postponing the following:

- Automatically finding and scraping thousands of businesses with AI.
- Complex multi-agent systems.
- WhatsApp Business API integration.
- Automated meeting scheduling across multiple platforms.
- A full CRM with too many features.
- An analytics dashboard with dozens of charts.

These features can be developed after the first version is running reliably.

## 7. Testing Plan

This is an area I want you to invest more effort in than usual. A workflow that works with one clean sample dataset is not enough to demonstrate that it can handle real-world situations.

Create at least 15–20 test scenarios. The following cases should be mandatory:

| Test case | Expected result |
| --- | --- |
| Valid lead | Inquiry is created and analyzed successfully. |
| Invalid email | Request is rejected or marked as invalid data. |
| Missing required field | AI analysis is not run. |
| Same submission ID is sent again | A second inquiry is not created. |
| Same email, but a new inquiry | A new inquiry is saved and linked to the existing contact. |
| AI returns invalid JSON | No fabricated result is written to the database. |
| AI does not respond | An error is recorded and an alert is sent. |
| HubSpot API fails | The error is recorded and can be recovered from safely. |
| Lead is rejected | No email is sent. |
| Lead has not been approved | No email is sent. |
| No consent is provided | No marketing follow-up is sent. |
| Email has already been sent | The email is not sent again when the workflow runs again. |
| Customer replies | Follow-up sequence stops. |
| Customer unsubscribes | All subsequent follow-ups stop. |
| Slack API fails | The notification error is recorded without losing the lead data. |

In particular, make the database statuses explicit so that a workflow retry does not accidentally create two emails or two CRM contacts.

When you finish, publish the actual test results—for example, how many scenarios you tested and how many passed. Do not claim that the system achieves 100% accuracy or saves 80% of the time unless you have measured those figures.

## 8. Turning the Project into a Strong Upwork Portfolio

Do not simply upload a screenshot of an n8n workflow to Upwork. Package the project as a case study.

**Your portfolio should include the following:**

### 1. Product UI screenshots

Show the lead-management screen, AI scores, statuses, email drafts, and approval actions.

For CRM interface inspiration, see [HashMicro CRM](https://www.hashmicro.com/id/crm).

### 2. Screenshots of the n8n workflows

Show Intake, Qualification, CRM Sync, Approval, Follow-up, and Error Handling.

For additional automation references, see [AI Restaurant Reservation Automation](https://www.oneclickitsolution.com/centerofexcellence/aiml/ai-restaurant-reservation-automation) and [GoHighLevel Outbound Voice AI](https://voiceaiwrapper.com/uses/gohighlevel-outbound-voice-ai).

### 3. Architecture diagram

Show how the frontend, backend, n8n, database, and external services communicate with one another.

### 4. 60–90-second demo video

Submit a sample lead → AI analyzes it → CRM is updated → Slack notification is received → employee approves it → email is sent → activity log is displayed.

### 5. GitHub README and handover files

- Business problem description.
- Feature list.
- Workflow diagram.
- Setup instructions.
- Credentials that need to be configured.
- Test cases and results.
- Workflow JSON files with sensitive information removed.

### Suggested Upwork portfolio title

**AI Lead Management & CRM Automation with n8n, OpenAI, HubSpot and Supabase**

You can use the following short description:

> Designed and built an AI-powered lead management system using n8n, OpenAI, Supabase, and HubSpot.
>
> The system captures website inquiries, validates and deduplicates lead data, uses AI to analyze customer requirements, assigns qualification scores, synchronizes CRM records, and sends internal notifications.
>
> It also includes human approval before customer-facing emails, automated follow-ups, execution logging, and error handling.

Only use this description after the corresponding features have actually been completed and tested.

### What clients should be able to see

Clients do not need to know how many nodes you use in n8n. They need to know:

- What business problem can you solve?
- Which platforms does the system connect?
- How does it handle invalid data?
- Does it prevent duplicate processing?
- Can it control AI actions?
- Can the client take over and modify the workflow independently?

That is why the README, test report, and demo video are just as important as the workflow JSON files.

## 9. Resources to Use During Implementation

You have already completed the official course, so you do not need to start learning everything from scratch. Use these resources as references while building each part.

| Resource | When to use it |
| --- | --- |
| [n8n N8N102 — Integrations](https://learn.n8n.io/courses/course-v1%3An8n%2BN8N102%2B2026H2/about) | Webhooks, APIs, authentication, Data Tables, and Code nodes. |
| [n8n N8N103 — AI, Testing & Best Practices](https://learn.n8n.io/courses/course-v1%3An8n%2BN8N103%2B2026H2/about) | AI Agents, testing, debugging, sub-workflows, and production practices. |
| [n8n Error Handling](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/flow-logic/handle-errors-gracefully.md) | Error handling and monitoring. |
| [n8n Human-in-the-loop](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/integrate-ai/ai-examples/human-in-the-loop-for-tools.md) | Controlling AI actions. |
| [n8n Wait Node](https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/core-nodes/n8n-nodes-base.wait.md) | Follow-ups and paused workflows. |
| [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Dashboard access control. |
| [n8n Security Audit](https://docs.n8n.io/hosting/securing/security-audit/) | Checking n8n security issues. |

One note about certificates: the n8n Academy distinguishes a certificate of completion from an official professional certification. Therefore, do not rely on a course-completion certificate as the only proof of your skills on your profile. A working project with documented tests provides stronger evidence of practical ability.

> Reference: n8n Academy

## 10. Final Assessment and Recommended Next Steps

I want you to view LeadFlow AI as a practical project that helps you move from **knowing how to use n8n** to **knowing how to design and deliver an automation system**.

Given your existing experience with React, Node.js, and Supabase, the areas that deserve the most effort are not the interface. They are data-flow design, API integration, error handling, AI control, and data consistency.

My recommended order of priorities is:

1. Make Workflow 01 work end-to-end with simulated data.
2. Add Supabase and duplicate-processing prevention.
3. Integrate AI with structured output and scoring logic.
4. Synchronize with HubSpot and send Slack notifications.
5. Add approval, email automation, and follow-ups.
6. Only then polish the dashboard and portfolio presentation.

**Definition of done:** Another person should be able to watch the video, read the README, import the workflows, configure their own credentials, and understand how the system works without needing you to explain every node.

After completing this project, you will have a stronger foundation for applying to jobs in n8n Workflow Automation, CRM Automation, API Integration, AI Lead Qualification, and Business Process Automation.

I recommend starting by writing the requirements and drawing the architecture diagram for LeadFlow AI before opening n8n and dragging in nodes. The next logical step is to design the **database schema, API contract, and four n8n workflows** in detail so that you have a clear technical blueprint to follow day by day.
