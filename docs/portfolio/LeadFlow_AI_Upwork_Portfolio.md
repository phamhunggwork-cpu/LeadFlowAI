<!--
Tài liệu portfolio: LeadFlow AI
Chuyển đổi từ nội dung script gốc sang Markdown; giữ nguyên nội dung và các thông tin nghiệp vụ.
-->

# LeadFlow AI — AI-Powered Lead Qualification & CRM Automation

> Đề xuất dự án n8n để xây dựng Upwork Portfolio.

## Mục lục

1. [Nghiên cứu thị trường và lý do chọn dự án](#1-mình-đã-nghiên-cứu-thị-trường-và-chọn-dự-án-dựa-trên-điều-gì)
2. [Mô tả dự án LeadFlow AI](#2-mô-tả-dự-án-leadflow-ai)
3. [Công nghệ nên sử dụng](#3-công-nghệ-nên-sử-dụng)
4. [Kiến trúc kỹ thuật](#4-kiến-trúc-kỹ-thuật-nên-triển-khai)
5. [Thiết kế cơ sở dữ liệu](#5-thiết-kế-cơ-sở-dữ-liệu)
6. [Roadmap 14 ngày](#6-roadmap-thực-hiện-trong-14-ngày)
7. [Bộ test](#7-bộ-test-để-chứng-minh-bạn-thực-sự-hiểu-n8n)
8. [Upwork Portfolio](#8-cách-biến-dự-án-thành-một-portfolio-mạnh-trên-upwork)
9. [Tài liệu tham khảo](#9-tài-liệu-bạn-nên-dùng-trong-lúc-thực-hiện)
10. [Đánh giá và hướng triển khai](#10-đánh-giá-cuối-cùng-và-hướng-triển-khai)

---

Mình khuyên bạn xây dựng một dự án có tên:

**Dự án đề xuất**

## LeadFlow AI
**AI-Powered Lead Qualification & CRM Automation**

Hệ thống tự động tiếp nhận khách hàng tiềm năng, phân tích nhu cầu bằng AI, đánh giá mức độ tiềm năng, cập nhật CRM, thông báo cho đội ngũ kinh doanh và hỗ trợ gửi email sau khi được con người phê duyệt.

**Công nghệ chính:** `n8n` · `AI Integration` · `REST API` · `Webhooks` · `CRM Automation` · `Supabase`

Đây không đơn thuần là một chatbot AI hay workflow tự động gửi email. Nó mô phỏng một quy trình kinh doanh thực tế mà một agency, công ty tư vấn hoặc doanh nghiệp dịch vụ có thể sử dụng.

Mình đánh giá đây là dự án phù hợp nhất để bạn bắt đầu xây dựng portfolio n8n, vì nó vừa có giá trị kinh doanh dễ giải thích, vừa cho phép bạn thể hiện những kỹ năng quan trọng trong các job AI Automation & Integration.

## 1. Mình đã nghiên cứu thị trường và chọn dự án dựa trên điều gì?
### Những gì khách hàng đang yêu cầu trên Upwork
Mình đã đối chiếu một số tin tuyển dụng Upwork gần đây với các workflow template trên n8n.

Có một số ví dụ khá sát với mục tiêu của bạn:

**Job 1 — AI Automation & Integration Specialist**

Một tin đăng ngày 17/11/2026 yêu cầu freelancer xây dựng các workflow đầu-cuối như lead generation, qualification, cập nhật CRM, đặt lịch, xử lý đơn hàng và AI Agent có thể chuyển các trường hợp phức tạp cho con người. Khách hàng yêu cầu kinh nghiệm n8n, Make, Zapier, OpenAI, Claude và API integration.
> Nguồn tham khảo: Upwork

**Job 2 — AI Lead Qualification and HubSpot CRM Automation**

Một job đăng khoảng ba tuần trước yêu cầu:

- Nhận lead từ CSV hoặc website form.
- Dùng AI phân loại Qualified, Needs Review và Not Qualified.
- Tạo hoặc cập nhật contact trong HubSpot.
- Kiểm tra lead trùng lặp.
- Validation, error handling và testing.
- Bàn giao workflow cùng hướng dẫn sử dụng.

Đây gần như chính xác là bài toán mà mình đề xuất bạn xây dựng.
> Nguồn tham khảo: Upwork

**Job 3 — n8n Lead Qualification & Follow-up**

Một job khác yêu cầu tiếp nhận dữ liệu từ website form, Meta Ads hoặc webhook; chuẩn hóa dữ liệu; chấm điểm bằng LLM; đồng bộ CRM; tạo email cá nhân hóa; theo dõi trạng thái và xử lý lỗi mà không làm thất lạc lead.
> Nguồn tham khảo: Upwork

Một job n8n khác còn nhấn mạnh nhà tuyển dụng muốn tìm người có thể tự thiết kế hệ thống, xử lý lỗi, triển khai self-hosted và bàn giao tài liệu, chứ không chỉ biết kết nối các node.
> Nguồn tham khảo: Upwork

Điểm quan trọng: đây là một mẫu nghiên cứu từ một số tin đăng, không phải thống kê toàn bộ thị trường Upwork. Tuy nhiên, các yêu cầu xuất hiện lặp lại đủ rõ để dùng làm cơ sở thiết kế portfolio.

### Đối chiếu với những workflow trên n8n
Trang use case chính thức của n8n mô tả quy trình Lead Management gồm bốn nhóm công việc:

1. Capture — tiếp nhận lead từ form, quảng cáo hoặc ứng dụng.
2. Enrich — bổ sung và làm sạch dữ liệu.
3. Qualify — sử dụng AI đánh giá lead.
4. Route — đưa lead đến đúng người hoặc hệ thống tiếp theo.
> Nguồn tham khảo: n8n

Ngoài ra, n8n Marketplace đã có các workflow tương tự như:

- [AI Lead Qualification & Routing with OpenAI, Slack and Airtable](https://n8n.io/workflows/9349-ai-powered-lead-qualification-and-routing-with-openai-slack-and-airtable/).
- [Lead Qualification and Routing with GPT-4o-mini, Google Sheets and HighLevel](https://n8n.io/workflows/9310-automate-lead-qualification-and-routing-with-gpt-4o-mini-google-sheets-and-highlevel-crm/).
- [Lead Nurturing via Email, WhatsApp, OpenAI and Google Sheets CRM](https://n8n.io/workflows/15616-nurture-leads-via-email-whatsapp-openai-and-google-sheets-crm/).

Những template này cho thấy bài toán có tính ứng dụng thực tế và có thể triển khai bằng hệ sinh thái n8n hiện tại.
> Nguồn tham khảo: n8n Workflow Templates

### So sánh các ý tưởng dự án
Mình chấm điểm theo mức độ phù hợp với mục tiêu xây portfolio n8n đầu tiên, không phải số liệu thống kê nhu cầu thị trường.

| Ý tưởng                            | Giá trị portfolio | Độ khó         | Đánh giá              |
| ---------------------------------- | ----------------- | -------------- | --------------------- |
| AI Lead Management & CRM           | 9.5/10            | Trung bình–khá | **Nên làm**           |
| AI Email & Customer Support Triage | 8.5/10            | Trung bình–khá | Dự án thứ hai         |
| AI Invoice & Document Processing   | 8/10              | Khá            | Có thể phát triển sau |
| AI Content Generation Pipeline     | 6.5/10            | Dễ–trung bình  | Khá phổ biến          |
| Chatbot FAQ đơn giản               | 5.5/10            | Dễ             | Chưa đủ nổi bật       |

**Tại sao mình không chọn chatbot AI đơn giản?**

Chatbot thường chỉ chứng minh được khả năng kết nối LLM, prompt và một vài công cụ. Trong khi đó, LeadFlow AI có thể chứng minh thêm:

- Nhận và xử lý dữ liệu từ bên ngoài.
- Thiết kế API integration.
- Xử lý logic có điều kiện.
- Lưu trữ và đồng bộ dữ liệu.
- Xây dựng AI có đầu ra cấu trúc.
- Kiểm soát hành động của AI.
- Xử lý lỗi và chống trùng lặp.
- Thiết kế workflow có thể bảo trì.

Đây là những năng lực gần với yêu cầu thực tế của các job automation hơn.

## 2. Mô tả dự án LeadFlow AI
### Tình huống kinh doanh giả lập
Hãy tưởng tượng bạn xây dựng hệ thống cho **Veloce Digital** — một boutique web & software studio (12 nhân sự, remote-first) chuyên thiết kế website và phát triển phần mềm.

Mỗi ngày công ty nhận được nhiều yêu cầu từ khách hàng qua website. Nhân viên phải tự đọc từng yêu cầu, kiểm tra ngân sách, xác định khách hàng có phù hợp hay không, nhập thông tin vào CRM và gửi email.

Quá trình thủ công có thể khiến nhân viên mất thời gian và bỏ sót khách hàng tiềm năng.

LeadFlow AI sẽ tự động hóa quy trình này.

### Quy trình người dùng nhìn thấy
**1. Khách hàng gửi yêu cầu**

Website form: tên, email, công ty, số điện thoại (tùy chọn), ngân sách, thời gian, mô tả dự án và xác nhận đồng ý nhận email (`consent_to_email`)

**2. n8n tiếp nhận và xử lý**

Validate → Normalize → Deduplicate → AI Analysis

**3. AI phân tích lead**

Chấm điểm, phân loại, tóm tắt nhu cầu và tạo email đề xuất

- **Qualified (75–100 điểm):** Ưu tiên nhân viên xử lý và duyệt gửi email.
- **Needs Review (45–74 điểm hoặc thiếu thông tin quan trọng):** Cần nhân viên kiểm tra thêm.
- **Not Qualified (< 45 điểm, ngoài phạm vi hoặc spam):** Lưu trữ, không gửi email tự động.

**4. Nhân viên phê duyệt**

Xem thông tin, kiểm tra email AI soạn và chọn Approve hoặc Reject

**5. Gửi email và cập nhật CRM**

Gửi email sau khi duyệt, ghi lại lịch sử, lên lịch follow-up nếu phù hợp

### Những tính năng cụ thể bạn cần xây dựng
| Tính năng           | Mô tả                                                  |
| ------------------- | ------------------------------------------------------ |
| Lead Capture        | Nhận dữ liệu từ website qua webhook                    |
| Data Validation     | Kiểm tra email, trường bắt buộc, dữ liệu không hợp lệ  |
| Data Normalization  | Chuẩn hóa email, tên, số điện thoại và dữ liệu đầu vào |
| Duplicate Detection | Không xử lý một submission nhiều lần                   |
| AI Qualification    | Phân tích nhu cầu và phân loại khách hàng              |
| Lead Scoring        | Chấm điểm dựa trên tiêu chí kinh doanh                 |
| CRM Integration     | Tạo/cập nhật contact trong HubSpot                     |
| Notification        | Thông báo lead quan trọng qua Slack                    |
| Human Approval      | Con người duyệt trước khi gửi email                    |
| Email Automation    | Gửi email và follow-up có điều kiện                    |
| Error Handling      | Ghi nhận lỗi và cảnh báo người quản trị                |
| Monitoring          | Theo dõi trạng thái các workflow                       |

Đây là phiên bản vừa đủ rộng để làm portfolio, nhưng chưa quá lớn thành một sản phẩm CRM hoàn chỉnh.

## 3. Công nghệ nên sử dụng
Mình đề xuất tận dụng các công nghệ bạn đã từng sử dụng thay vì học thêm quá nhiều công nghệ mới.

**n8n — Automation Engine**

Điều phối tất cả workflow, xử lý logic và tích hợp API.

**React + TypeScript**

Website form và dashboard quản lý lead.

**Node.js**

API trung gian nhận request và gọi webhook an toàn.

**Supabase / PostgreSQL**

Lưu lead, trạng thái, lịch sử xử lý và dữ liệu dashboard.

**HubSpot CRM**

Tích hợp CRM thực tế, tạo và cập nhật contact.

**OpenAI hoặc Gemini API**

Phân tích yêu cầu, trích xuất dữ liệu và soạn email.

**Slack**

Gửi thông báo đến đội ngũ kinh doanh.

**Tại sao dùng cả Supabase và HubSpot?**

Hai công cụ có nhiệm vụ khác nhau:

- Supabase là nơi lưu dữ liệu chính của ứng dụng demo, lịch sử xử lý, trạng thái duyệt và các hoạt động automation.
- HubSpot thể hiện khả năng đồng bộ với một CRM bên thứ ba mà khách hàng có thể đang sử dụng.

Nếu muốn giảm độ khó, bạn có thể hoàn thành toàn bộ hệ thống với Supabase trước, rồi thêm HubSpot sau. Tuy nhiên, mình khuyến nghị vẫn đưa HubSpot vào bản portfolio cuối cùng.

## 4. Kiến trúc kỹ thuật nên triển khai
Đây là phần quan trọng nhất. Bạn cần chia dự án thành các workflow nhỏ thay vì làm mọi thứ trong một workflow khổng lồ.

### Workflow 01 — Lead Intake & Qualification
**Mức độ ưu tiên: Bắt buộc**

Đây là workflow cốt lõi.

- **Webhook Trigger** — Nhận POST request từ backend Node.js

- **Validate & Normalize** — Code / IF: kiểm tra và chuẩn hóa dữ liệu

- **Idempotency & Duplicate Check** — Kiểm tra submission đã được xử lý chưa

- **AI Qualification** — Structured output: loại dịch vụ, nhu cầu, mức độ phù hợp, email draft

- **Lead Scoring & Routing** — Tính điểm theo quy tắc đã định nghĩa, phân nhánh IF / Switch

- **Supabase** — Lưu dữ liệu

- **HubSpot** — Đồng bộ CRM

- **Slack Notification** — Thông báo lead và đề xuất hành động cho nhân viên

**Chi tiết cần chú ý:**

1. Webhook không nên nhận dữ liệu mà không kiểm tra.
2. Email nên được chuẩn hóa thành chữ thường và kiểm tra hợp lệ.
3. Dùng `submission_id` duy nhất để ngăn một sự kiện webhook bị xử lý lặp.
4. Không nên để AI tự quyết định toàn bộ điểm số. Hãy dùng AI để trích xuất và phân loại, sau đó dùng quy tắc JavaScript để tính điểm.

Ví dụ hệ thống có thể sử dụng bộ tiêu chí:

| Tiêu chí                    | Điểm tối đa |
| --------------------------- | ----------- |
| Phù hợp với dịch vụ công ty | 30          |
| Ngân sách                   | 30          |
| Thời gian triển khai        | 20          |
| Mức độ rõ ràng của nhu cầu  | 20          |
| **Tổng**                    | **100**     |

Đây là bộ quy tắc giả lập để bạn chứng minh thiết kế có thể điều chỉnh theo tiêu chí khách hàng, không phải công thức chuẩn của ngành.

### Workflow 02 — Human Approval & Email Sending
**Mức độ ưu tiên: Bắt buộc**

AI có thể đề xuất nội dung email, nhưng không nên tự động gửi ngay.

Quy trình:

1. Nhận lead đã phân tích từ Workflow 01.
2. Lưu bản nháp email trong Supabase.
3. Hiển thị lead trên dashboard.
4. Nhân viên mở thông tin và đọc bản nháp.
5. Nhấn Approve hoặc Reject.
6. Backend gọi một webhook riêng của n8n.
7. n8n xác thực yêu cầu duyệt, cập nhật trạng thái và gửi email nếu được chấp thuận.

Các trạng thái duyệt và gửi email được chuẩn hóa theo `LeadFlowAI.sql`:

- **`inquiries.approval_status`:** `not_required → pending → approved` (hoặc `rejected`)
- **`email_messages.status`:** `draft → pending_approval → approved → queued → sent` (hoặc `failed` / `cancelled`)

Điều này giúp dự án thể hiện một nguyên tắc quan trọng trong AI Automation: **AI đề xuất, con người kiểm soát những hành động có tác động đến khách hàng.**

Tài liệu n8n cũng có hướng dẫn Human-in-the-loop để yêu cầu con người phê duyệt trước khi AI Agent thực thi một số công cụ có rủi ro, như gửi tin nhắn hay chỉnh sửa dữ liệu.
> Nguồn tham khảo: GitHub / tài liệu n8n

### Workflow 03 — Automated Follow-up
**Mức độ ưu tiên: Nên có trong bản portfolio**

Sau khi khách hàng đã được liên hệ, hệ thống có thể tự động kiểm tra những lead chưa phản hồi.

Ví dụ:

- Sau 24 giờ: kiểm tra lead đã trả lời chưa.
- Nếu chưa trả lời và có sự đồng ý nhận email: gửi email follow-up thứ nhất.
- Nếu khách hàng phản hồi: dừng chuỗi follow-up.
- Nếu khách hàng từ chối nhận email: đánh dấu unsubscribed và dừng tất cả email tiếp theo.
- Nếu lead được chuyển sang trạng thái Closed hoặc Won: ngừng follow-up.

Bạn có thể sử dụng **Schedule Trigger + truy vấn Supabase** để tìm những lead đã đến thời điểm follow-up, hoặc sử dụng Wait node để tạm dừng và tiếp tục workflow sau một khoảng thời gian. Wait node hỗ trợ resume theo thời gian hoặc webhook call.
> Nguồn tham khảo: GitHub / tài liệu n8n

Đừng cố tạo một chuỗi chăm sóc khách hàng quá phức tạp ngay từ đầu. Một lần follow-up có đầy đủ điều kiện dừng đã đủ để chứng minh logic automation.

### Workflow 04 — Error Handling & Logging
**Mức độ ưu tiên: Bắt buộc**

Đây là phần phân biệt một workflow học tập với một workflow được thiết kế có tính vận hành.

Bạn cần nghĩ đến những tình huống:

- OpenAI/Gemini API không phản hồi.
- HubSpot trả về lỗi xác thực.
- Supabase bị timeout.
- AI trả về kết quả không đúng JSON schema.
- Email API bị lỗi.
- Một webhook được gửi lại nhiều lần.

Thiết kế một workflow riêng bắt đầu bằng Error Trigger để:

1. Nhận thông tin lỗi.
2. Xác định workflow và node xảy ra lỗi.
3. Ghi lỗi vào bảng `workflow_errors`.
4. Gửi cảnh báo đến Slack.
5. Cho phép người quản trị kiểm tra và chạy lại khi an toàn.

Tài liệu chính thức của n8n hướng dẫn dùng Error Trigger để xây dựng error workflow dùng chung cho nhiều workflow, đồng thời sử dụng execution history để điều tra lỗi.
> Nguồn tham khảo: GitHub / tài liệu n8n

Lưu ý: retry không đồng nghĩa với xử lý lỗi an toàn. Nếu một lần gửi email thành công nhưng bước cập nhật database thất bại, việc chạy lại có thể gửi email hai lần. Vì vậy, bạn cần trạng thái xử lý và cơ chế chống lặp cho từng hành động.

## 5. Thiết kế cơ sở dữ liệu
Bạn có thể sử dụng Supabase/PostgreSQL.

Mình đề xuất cấu trúc chuẩn hóa gồm **6 bảng** (đồng bộ với `LeadFlowAI.sql`):

| Table             | Vai trò                                                      |
| ----------------- | ------------------------------------------------------------ |
| `contacts`        | Thông tin cá nhân và doanh nghiệp                            |
| `inquiries`       | Các yêu cầu dự án, ngân sách, consent và trạng thái vòng đời |
| `lead_analyses`   | Kết quả phân tích AI, điểm số và bản nháp email gốc (audit)  |
| `email_messages`  | Quản lý bản nháp duyệt, trạng thái gửi và idempotency key    |
| `activity_logs`   | Lịch sử hành động, phê duyệt và gửi email                    |
| `workflow_errors` | Lỗi phát sinh từ n8n                                         |

Một số field quan trọng:

**contacts**

- `id`
- `full_name`
- `email` (unique sau khi chuẩn hóa `LOWER(TRIM(email))`)
- `company_name`
- `phone`
- `hubspot_contact_id`

**inquiries**

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

**lead_analyses**

- `id`
- `inquiry_id`
- `model_name`, `prompt_version`
- `detected_service`
- `project_summary`
- `missing_information` (`JSONB`)
- `scope_fit` (`high`, `medium`, `low`)
- `spam_suspected`
- `qualification_score`, `qualification_status`, `priority`
- `draft_email` (bản nháp gốc AI sinh ra để lưu vết)

**email_messages**

- `id`
- `inquiry_id`
- `message_type` (`initial`, `follow_up`, `reply`, `other`)
- `direction` (`outbound`, `inbound`)
- `recipient_email`, `subject`, `body`
- `status` (`draft`, `pending_approval`, `approved`, `queued`, `sent`, `failed`, `cancelled`)
- `idempotency_key` (unique), `provider_message_id` (unique)
- `approved_by`, `approved_at`, `sent_at`

**activity_logs**

- `id`
- `inquiry_id`
- `event_type`
- `event_data` (`JSONB`)
- `created_at`

**workflow_errors**

- `id`
- `inquiry_id`, `submission_id`
- `workflow_name`, `execution_id`, `node_name`
- `error_message`
- `status` (`open`, `resolved`), `resolved_at`

`submission_id` nên có unique constraint để hệ thống phát hiện request bị gửi lại. Một người có thể gửi nhiều yêu cầu dự án khác nhau, vì vậy không nên dùng email làm khóa duy nhất của toàn bộ inquiry.

Nếu làm dashboard có đăng nhập, hãy bật RLS và viết policy phù hợp. Supabase nhấn mạnh rằng grants và RLS policies là hai lớp kiểm soát riêng, và service role key có thể bỏ qua RLS nên tuyệt đối không đưa vào trình duyệt.
> Nguồn tham khảo: Supabase Docs

## 6. Roadmap thực hiện trong 14 ngày
Mình đề xuất khoảng **3–4 giờ mỗi ngày**, tổng cộng khoảng 42–56 giờ. Đây là kế hoạch cho một phiên bản portfolio có dashboard cơ bản và tích hợp HubSpot, không phải một CRM thương mại đầy đủ.

**Theo dõi tiến độ dự án**

**Tiến độ: 6/51 nhiệm vụ**

#### Ngày 1 — Chốt bài toán và nghiệp vụ

**Tiến độ: 3/3 nhiệm vụ**

- [x] Viết mô tả công ty giả lập và quy trình nhận lead
- [x] Chốt field của form và bộ tiêu chí chấm điểm
- [x] Vẽ sơ đồ luồng dữ liệu và các trạng thái lead

> **Hoàn thành: Có tài liệu Requirement + Flowchart**

#### Ngày 2 — Khởi tạo môi trường

**Tiến độ: 3/3 nhiệm vụ**

- [x] Chạy n8n local bằng Docker hoặc dùng instance đang có
- [x] Tạo Supabase project và các bảng ban đầu
- [x] Tạo form test và tập dữ liệu lead giả lập

> **Hoàn thành: Môi trường hoạt động, database sẵn sàng**

#### Ngày 3 — Xây dựng Lead Intake

**Tiến độ: 0/3 nhiệm vụ**

- [ ] Tạo React form
- [ ] Tạo Node API trung gian gọi webhook có xác thực
- [ ] Tạo Webhook Trigger trong n8n

> **Hoàn thành: Gửi form thành công tới workflow**

#### Ngày 4 — Validation và chống trùng

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Kiểm tra dữ liệu bắt buộc và email
- [ ] Chuẩn hóa dữ liệu bằng Code node
- [ ] Tạo submission_id và idempotency check
- [ ] Lưu inquiry vào Supabase

> **Hoàn thành: Dữ liệu hợp lệ được lưu, request trùng không xử lý lại**

#### Ngày 5 — AI Qualification

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Viết system prompt và tiêu chí trích xuất
- [ ] Kết nối model API
- [ ] Yêu cầu AI trả kết quả theo JSON schema
- [ ] Kiểm tra và xử lý output lỗi

> **Hoàn thành: AI trả kết quả có cấu trúc ổn định**

#### Ngày 6 — Lead Scoring & Routing

**Tiến độ: 0/3 nhiệm vụ**

- [ ] Viết scoring rules bằng JavaScript
- [ ] Tạo nhánh Qualified / Needs Review / Not Qualified
- [ ] Lưu điểm số và lý do vào database

> **Hoàn thành: Các lead được phân loại theo đúng quy tắc**

#### Ngày 7 — HubSpot Integration

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Tạo HubSpot developer/private app access phù hợp
- [ ] Kết nối credential trong n8n
- [ ] Tạo hoặc cập nhật contact bằng email
- [ ] Kiểm tra field mapping và lỗi API

> **Hoàn thành: Lead được đồng bộ lên HubSpot**

#### Ngày 8 — Slack Notification

**Tiến độ: 0/3 nhiệm vụ**

- [ ] Tạo Slack app hoặc webhook phù hợp
- [ ] Soạn nội dung thông báo
- [ ] Chỉ gửi cảnh báo ưu tiên cho những lead đạt điều kiện

> **Hoàn thành: Nhân viên nhận được thông báo có đủ thông tin**

#### Ngày 9 — Human Approval

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Tạo màn hình lead review đơn giản
- [ ] Hiển thị AI summary và email draft
- [ ] Xây dựng approve/reject endpoint
- [ ] Xác thực yêu cầu trước khi thực thi

> **Hoàn thành: Người dùng duyệt được lead qua dashboard**

#### Ngày 10 — Email Automation

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Kết nối email provider
- [ ] Gửi email chỉ sau khi có approval
- [ ] Lưu lịch sử gửi email
- [ ] Ngăn gửi lại cùng một email

> **Hoàn thành: Email được gửi và có log**

#### Ngày 11 — Follow-up Automation

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Tạo scheduler tìm lead đến hạn
- [ ] Kiểm tra trạng thái, consent và reply
- [ ] Gửi một email follow-up có điều kiện
- [ ] Dừng chuỗi khi lead phản hồi hoặc unsubscribe

> **Hoàn thành: Follow-up hoạt động đúng điều kiện**

#### Ngày 12 — Error Handling

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Tạo Error Trigger workflow
- [ ] Ghi lỗi vào Supabase
- [ ] Gửi Slack alert khi lỗi
- [ ] Kiểm thử retry và chống lặp hành động

> **Hoàn thành: Lỗi được ghi nhận và có cách khôi phục**

#### Ngày 13 — Kiểm thử toàn hệ thống

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Test lead hợp lệ, thiếu field và email sai
- [ ] Test duplicate và webhook gửi lặp
- [ ] Test AI output sai, API lỗi và approval bị từ chối
- [ ] Test không gửi email khi chưa có consent hoặc approval

> **Hoàn thành: Có test report ghi rõ kết quả**

#### Ngày 14 — Hoàn thiện Portfolio

**Tiến độ: 0/4 nhiệm vụ**

- [ ] Làm sạch UI và dữ liệu demo
- [ ] Export workflow JSON đã loại bỏ thông tin nhạy cảm
- [ ] Viết README và sơ đồ kiến trúc
- [ ] Quay demo video 60–90 giây

> **Hoàn thành: Có sản phẩm, mã nguồn và video để đưa vào Upwork**

### Những phần không nên làm trong 14 ngày đầu
Để tránh dự án bị phình quá lớn, mình khuyên chưa nên làm:

- AI tự động tìm và scrape hàng nghìn doanh nghiệp.
- Multi-agent phức tạp.
- Tích hợp WhatsApp Business API.
- Đặt lịch họp tự động với nhiều nền tảng.
- Xây dựng một CRM đầy đủ với quá nhiều tính năng.
- Tạo dashboard analytics với hàng chục biểu đồ.

Các chức năng đó có thể phát triển sau khi phiên bản đầu tiên chạy ổn định.

## 7. Bộ test để chứng minh bạn thực sự hiểu n8n
Đây là phần mình muốn bạn đầu tư nhiều hơn bình thường. Một workflow chạy được với một mẫu dữ liệu đẹp chưa đủ chứng minh khả năng xử lý tình huống thực tế.

Hãy tạo tối thiểu 15–20 tình huống test. Trong đó, các trường hợp sau nên bắt buộc đạt:

| Test case                    | Kết quả mong muốn                                 |
| ---------------------------- | ------------------------------------------------- |
| Lead hợp lệ                  | Tạo inquiry và phân tích thành công               |
| Email không hợp lệ           | Từ chối hoặc đưa vào trạng thái lỗi dữ liệu       |
| Thiếu trường bắt buộc        | Không chạy AI                                     |
| Gửi lại cùng submission ID   | Không tạo inquiry thứ hai                         |
| Cùng email nhưng inquiry mới | Lưu inquiry mới, liên kết contact cũ              |
| AI trả JSON lỗi              | Không ghi kết quả giả định vào database           |
| AI không phản hồi            | Có lỗi và cảnh báo                                |
| HubSpot API lỗi              | Ghi lỗi và có thể khôi phục an toàn               |
| Lead bị Reject               | Không gửi email                                   |
| Lead chưa được Approve       | Không gửi email                                   |
| Không có consent             | Không gửi marketing follow-up                     |
| Email đã gửi                 | Không gửi lại khi workflow chạy lại               |
| Khách hàng phản hồi          | Dừng follow-up                                    |
| Khách hàng unsubscribe       | Dừng tất cả follow-up tiếp theo                   |
| Slack API lỗi                | Ghi lại lỗi thông báo, không làm mất dữ liệu lead |

Đặc biệt, bạn nên làm rõ các trạng thái trong database để không xảy ra trường hợp một workflow retry làm phát sinh hai email hoặc hai CRM contact.

Khi hoàn thành, hãy công bố kết quả test thực tế, chẳng hạn số trường hợp đã kiểm thử và bao nhiêu trường hợp pass. Đừng tự ghi rằng hệ thống đạt độ chính xác 100% hay tiết kiệm 80% thời gian nếu bạn chưa đo được những con số đó.

## 8. Cách biến dự án thành một Portfolio mạnh trên Upwork
Đừng chỉ đăng một ảnh chụp workflow n8n lên Upwork. Hãy đóng gói nó thành một case study.

**Portfolio nên có những thành phần này**

### 1. Ảnh chụp giao diện sản phẩm

Màn hình quản lý lead, điểm số AI, trạng thái, email draft và hành động duyệt.

Tham khảo giao diện CRM: [HashMicro CRM](https://www.hashmicro.com/id/crm).

### 2. Ảnh chụp các workflow n8n

Intake, qualification, CRM sync, approval, follow-up và error handling.

Tham khảo thêm về automation: [AI Restaurant Reservation Automation](https://www.oneclickitsolution.com/centerofexcellence/aiml/ai-restaurant-reservation-automation) và [GoHighLevel Outbound Voice AI](https://voiceaiwrapper.com/uses/gohighlevel-outbound-voice-ai).

### 3. Sơ đồ kiến trúc

Cho thấy frontend, backend, n8n, database và các dịch vụ bên ngoài giao tiếp với nhau như thế nào.

### 4. Video demo 60–90 giây

Gửi một lead giả lập → AI phân tích → CRM cập nhật → nhận Slack notification → duyệt → email được gửi → xem activity log.

### 5. GitHub README và file bàn giao

- Mô tả bài toán.
- Danh sách chức năng.
- Sơ đồ workflow.
- Hướng dẫn cài đặt.
- Các credential cần cấu hình.
- Bộ test và kết quả.
- File JSON workflow đã làm sạch thông tin nhạy cảm.

### Gợi ý tên Portfolio trên Upwork
**AI Lead Management & CRM Automation with n8n, OpenAI, HubSpot and Supabase**

Mô tả ngắn có thể dùng:

> Designed and built an AI-powered lead management system using n8n, OpenAI, Supabase, and HubSpot.
>
> The system captures website inquiries, validates and deduplicates lead data, uses AI to analyze customer requirements, assigns qualification scores, synchronizes CRM records, and sends internal notifications.
>
> It also includes human approval before customer-facing emails, automated follow-ups, execution logging, and error handling.

Nhớ chỉ sử dụng phần mô tả này sau khi tính năng tương ứng đã hoàn thành và kiểm thử được.

### Điều khách hàng nên nhìn thấy
Khách hàng không cần hiểu bạn sử dụng bao nhiêu node trong n8n. Họ cần biết:

- Bạn giải quyết được vấn đề kinh doanh nào?
- Hệ thống kết nối những nền tảng nào?
- Khi dữ liệu sai thì xử lý ra sao?
- Có tránh được việc xử lý dữ liệu trùng không?
- Có kiểm soát được hành động của AI không?
- Họ có thể tự tiếp quản và chỉnh sửa workflow không?

Đó là lý do README, test report và video demo quan trọng không kém workflow JSON.

## 9. Tài liệu bạn nên dùng trong lúc thực hiện
Bạn đã hoàn thành khóa học chính thức, vì vậy không cần quay lại học từ đầu. Hãy dùng các tài liệu này để tra cứu khi xây từng phần.

| Tài liệu                                                                                                                                                        | Dùng trong giai đoạn                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [n8n N8N102 — Integrations](https://learn.n8n.io/courses/course-v1%3An8n%2BN8N102%2B2026H2/about)                                        | Webhook, API, authentication, Data Tables, Code node    |
| [n8n N8N103 — AI, Testing & Best Practices](https://learn.n8n.io/courses/course-v1%3An8n%2BN8N103%2B2026H2/about)                        | AI Agent, testing, debugging, sub-workflows, production |
| [n8n Error Handling](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/flow-logic/handle-errors-gracefully.md)                     | Xử lý và theo dõi lỗi                                   |
| [n8n Human-in-the-loop](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/integrate-ai/ai-examples/human-in-the-loop-for-tools.md) | Kiểm soát hành động AI                                  |
| [n8n Wait Node](https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/core-nodes/n8n-nodes-base.wait.md)                | Follow-up và workflow tạm dừng                          |
| [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)                                                    | Phân quyền dashboard                                    |
| [n8n Security Audit](https://docs.n8n.io/hosting/securing/security-audit/)                                                               | Kiểm tra vấn đề bảo mật của n8n                         |

Một lưu ý về chứng chỉ: trang Academy của n8n phân biệt certificate of completion với chứng chỉ chuyên môn chính thức. Vì vậy, đừng để chứng nhận hoàn thành khóa học trở thành điểm chứng minh năng lực duy nhất trên profile. Dự án vận hành được và được kiểm thử sẽ có giá trị chứng minh thực hành rõ hơn.
> Nguồn tham khảo: n8n Academy

## 10. Đánh giá cuối cùng và hướng triển khai
Mình muốn bạn xem LeadFlow AI như một dự án thực hành để chuyển từ trạng thái **biết sử dụng n8n** sang **biết thiết kế và bàn giao một hệ thống automation**.

Với nền tảng React, Node.js và Supabase mà bạn đã có, phần nên đầu tư công sức nhất không phải là giao diện. Đó là thiết kế luồng dữ liệu, API integration, xử lý lỗi, kiểm soát AI và đảm bảo tính nhất quán của dữ liệu.

Thứ tự ưu tiên của mình:

1. Làm cho Workflow 01 chạy hoàn chỉnh với dữ liệu giả lập.
2. Thêm Supabase và cơ chế chống xử lý trùng.
3. Tích hợp AI có structured output và scoring logic.
4. Đồng bộ HubSpot và gửi Slack notification.
5. Thêm approval, email automation và follow-up.
6. Cuối cùng mới hoàn thiện dashboard và portfolio.

**Tiêu chuẩn hoàn thành:** một người khác có thể xem video, đọc README, import workflow, cấu hình credential của họ và hiểu cách hệ thống hoạt động mà không cần bạn giải thích từng node.

Sau khi hoàn thành dự án này, bạn sẽ có cơ sở tốt hơn để ứng tuyển các nhóm job như n8n Workflow Automation, CRM Automation, API Integration, AI Lead Qualification và Business Process Automation.

Mình khuyên bạn bắt đầu bằng việc viết requirement và sơ đồ kiến trúc cho LeadFlow AI trước khi mở n8n kéo node. Bước tiếp theo hợp lý là mình cùng bạn thiết kế chi tiết **database schema, API contract và 4 workflow n8n**, để bạn có một bản thiết kế kỹ thuật rõ ràng làm theo từng ngày.
