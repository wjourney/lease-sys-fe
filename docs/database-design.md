# SUPREME BAY 数据库方案：按业务模块划分

更新：2026-09-29。依据五角色 PDF 和用户后续确认：账号属于个人；项目和单位分表；账单及分次收款合并到 incomes；支出使用 expenses；佣金关联订单；发票关联已确认收款；单位类型合入系统设置；文件与资料共用一张 materials，按业务归属逐条保存，不引入资料父子结构。订单采用授权直接修改并立即生效，过程保存在各业务记录的 operation_logs 字段中；只记录新增、修改、删除。当前实现共 **12 张应用表**，不再区分核心表与配套表。不含 Prisma 迁移工具内部表。数据库及应用已实现；以下保留业务设计说明，实际字段名称、默认值及约束以后端 `prisma/schema.prisma` 和迁移 SQL 为准。

## 全量表及核心字段

各业务表统一包含 id、created_at、updated_at、created_by、updated_by、revision、operation_logs（jsonb，默认空数组）、deleted_at（可空）、deleted_by（可空）。operation_logs 与具体业务记录保存在同一行，不单独建操作记录表。金额使用 numeric(18,2)，币种单独保存。核心关联使用外键；JSONB 只保存有明确结构的配置、快照和变更内容。

| 序号 | 模块         | 表名            | 核心业务字段                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---: | ------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | 账号         | users           | username、password_hash、auth_version、role、name、phone、email、sales_company_id、branch_code、position_code、status、expires_at                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|    2 | 销售公司     | sales_companies | company_no、name_zh、name_en、contact_name、phone、email、address、registration_no、registration_expires_on、service_starts_on、service_ends_on、branches、positions、status                                                                                                                                                                                                                                                                                                                                                                                                      |
|    3 | 项目         | projects        | code、name、region、address、developer、completion_date、description、sales_can_view_exact_rent、type_configs、lessor_profile、status                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|    4 | 单位         | units           | project_id、unit_type_code、unit_no、building、floor、room_no、area、layout、reference_rent、min_rent、max_rent、min_lease_months、commission_note、enabled                                                                                                                                                                                                                                                                                                                                                                                                                       |
|    5 | 订单         | orders          | order_no、project_id、unit_id、sales_company_id、sales_user_id、tenant_type、tenant_name、tenant_registration_no、tenant_contact_name、tenant_phone、tenant_email、tenant_snapshot、unit_snapshot、sales_snapshot、starts_on、ends_on、monthly_rent、deposit_amount、currency、payment_interval_months、rent_due_day、bill_lead_days、next_bill_generation_on、status、first_payment_registered_at、occupancy_state、actual_termination_on、handover_status、handed_over_at、deposit_deduction_amount、deposit_deduction_reason、deposit_settled_at、current_contract_material_id |
|    6 | 收入         | incomes         | record_no、record_type、parent_id、order_id、project_id、unit_id、fee_type、amount、adjustment_amount、currency、period_start、period_end、due_on、received_on、fund_account_id、payment_method、bank_reference、payer_snapshot、status、registered_by、confirmed_by、confirmed_at、rejection_reason、source_key、recurrence_rule                                                                                                                                                                                                                                                 |
|    7 | 支出         | expenses        | expense_no、order_id、project_id、unit_id、commission_id、original_income_id、fee_type、amount、paid_amount、currency、due_on、paid_on、fund_account_id、payment_method、bank_reference、payee_snapshot、status、registered_by、source_key、remark                                                                                                                                                                                                                                                                                                                                |
|    8 | 佣金         | commissions     | commission_no、order_id、sales_company_id、sales_user_id、mode、period_start、period_end、due_on、amount、currency、entered_by、entered_at、status、remark                                                                                                                                                                                                                                                                                                                                                                                                                        |
|    9 | 发票         | invoices        | invoice_no、income_id、amount、currency、issued_on、payer_snapshot、fee_snapshot、status、replaces_invoice_id、void_reason、render_status、render_attempts、render_next_retry_at、render_error、email_to、email_subject、email_status、email_request_id、email_attempts、email_next_retry_at、email_last_error、last_sent_at                                                                                                                                                                                                                                                      |
|   10 | 文件与资料   | materials       | project_id、unit_id、order_id、income_id、expense_id、invoice_id、sales_company_id、user_id（归属择一）、category、title、description、body、source_url、storage_key、original_name、mime_type、size_bytes、checksum、material_group_id、version_no、is_current、status、sort_order、uploaded_by、template_material_id、contract_snapshot、change_note、voided_at、void_reason                                                                                                                                                                                                    |
|   11 | 资金账户配置 | fund_accounts   | name、bank_name、account_identifier、currency、enabled、remark                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|   12 | 系统设置     | system_settings | key、value、revision、updated_by；单位类型字典包含 code、name、sort_order、enabled                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

以上列出核心字段；项目、单位展示属性及订单首末期折算等仍按 PDF 补全，不因表数量精简而删除功能。

## 模块边界

### 账号、公司与租客

账号对应使用系统的个人，不是公司登录主体。账号与销售公司分开，一家公司有多个个人账号。固定五角色使用枚举：超级管理员、内部运营、内部财务、销售公司管理员、销售员工。内部账号不绑定销售公司；销售角色必须绑定公司。五种角色共享业务表，由服务端授权过滤。

分行、职位暂为公司内带稳定编码的选项配置；禁用保留旧引用，有独立组织管理需求再拆表。角色和权限暂不额外建管理表。

首版没有独立租客档案管理需求，租客资料直接保存在订单，不增加 tenants 表。公司租客与销售公司仍是不同业务对象。不能仅凭同名合并历史租客。

### 项目与单位

一个项目有多个具体房产单位。单位类型作为 system_settings 中 key = unit_types 的字典，value 保存 code、name、sort_order、enabled 组成的选项列表，不单独建单位类型表。units.unit_type_code 保存稳定编码，projects.type_configs 也按该编码引用类型并保存项目专属展示配置。

编码唯一且使用后不可改，名称可以修改；已引用选项只允许停用，不直接删除。服务端统一校验单位和项目配置的编码；历史记录仍可显示停用选项，新增选择排除停用项。字典更新使用 revision 和事务控制，不允许配置写入绕过引用校验。这种 JSON 字典不具备独立类型表的数据库外键保障，因此编码和引用校验必须在服务端实现。

单位类型仅保存共用选项。具体单位的面积、租金仍放 units，项目专属的面积／价格范围仍放 projects.type_configs，不放全局字典。

所有项目共用 projects，所有单位共用 units，不按项目分别建表。单位表保存当前参考报价，订单保存签约租金及单位快照；报价修改不能回写历史订单。订单如同时保存 project_id 和 unit_id，必须校验单位属于该项目。

单位可租情况根据有效订单占用、租期和实际交还查询；服务和数据库约束防止重叠出租。到期不自动等于已交还。不预先创建逐月库存表。

### 订单及变更

orders 是唯一订单主表，一张订单对应一个单位。退租、交还和最终押金扣除结果放订单，操作过程留历史；订单合同作为 materials 的订单合同分类保存版本。

按用户确认取消订单变更申请表及其申请、审批、未来生效流程。有订单修改权限的人员直接修改 orders，保存成功立即生效。写入时校验 revision 防止覆盖他人修改，并在同一事务向该订单的 operation_logs 追加 UPDATE 记录：操作人、操作时间、修改前后内容和原因。修改依据文件直接归属订单。

首期实际付款登记后关闭普通录单编辑，后续使用受单独权限控制的订单修改操作，仍为直接修改而非审批。修改租期时校验单位占用冲突；租金、付款周期等修改只影响后续规则，既有应收、已确认收款和发票不得随订单字段自动覆盖，必要的财务调整通过明确业务操作留痕。首期租金与押金确认收齐后订单生效；订单状态、单位交还、财务结清分别判断。

### 收入：应收与实际收款合在一张表

incomes.record_type 区分 RECEIVABLE（应收主记录）和 RECEIPT（收款明细）。RECEIVABLE 的 parent_id 为空，保存费用、应收金额、到期日和可空的订单／项目／单位关联。RECEIPT 的 parent_id 必须指向一条 RECEIVABLE，保存单次实际到账金额、日期、账户、凭证关联和财务状态。

这是同表的一层主从关系，不允许多层嵌套。parent_id 使用自关联外键，记录类型与父记录类型的一致性由数据库触发器或严格事务服务保证，不能仅靠普通外键。收款行的订单／项目／单位等归属从父记录读取，不重复填写。已使用的记录类型禁止切换。

一笔应收 10,000 元，分次收到 6,000 和 4,000：incomes 内为一条应收主记录和两条收款明细。收入列表只查应收主记录，实收统计只累加 CONFIRMED 收款明细，不把两种金额相加。

收款状态为 PENDING、CONFIRMED、REJECTED；登记和确认是同一条明细的状态变化。待确认占用可登记额度但不计入实收。登记和确认锁定应收主记录，校验金额、币种及可登记余额，防止并发超收。单次金额为正数。父记录的结清状态由明细汇总；若缓存汇总字段，必须同事务维护且可重算。

无订单收入仍使用同一张表，其应收主记录 order_id 为空；可以关联项目，也可以是公司公共收入。实际收款录入可在同一表单、同一事务建立应收主记录和收款明细。填写订单／项目／单位时必须校验关联一致。

周期应收使用唯一来源键和账期防止重复生成，规则修改只影响未来账期。已存在收款的应收记录不能直接删除或改原金额；受权限控制的 adjustment_amount 调整与该收入行的 UPDATE 操作记录同事务提交，有效应收不得低于已确认加待确认金额。实际退款使用 expenses.original_income_id 关联原已确认收款明细，保留追溯关系，不覆盖历史收款。

### 支出：一张表保存应付及付款结果

expenses 保存费用类型、应付 amount、收款方、到期日和可空的订单／项目／单位关联。待付款时 paid_amount 为零、paid_on 为空；实际付款后保存金额、日期、账户和凭证，状态变为 PAID。只有已付款记录进入实际支出统计。

普通支出按设计稿全额登记，每条记录最多对应一次实际付款，不支持在同一条记录反复覆盖付款历史。佣金可分次支付，每次支付对应一条 expenses，关联同一期 commissions；先前已为本次支付建待付记录时更新该记录，不能重复新增。佣金总应付以 commissions 为准，各次支出的应付只是本次计划金额，不额外创建一条同金额的全额费用重复统计。

订单押金扣除结果保存在 orders，退款计划和实际退款放 expenses。累计扣除、已退及已承诺退款不超过可处理押金，执行时锁定订单校验。收入、退款与押金扣除分别统计。

### 佣金与发票

佣金必须关联订单，按月／年、公司和销售人员归属记录；待财务填写时 amount 可空。已付佣金只从关联的已付款 expenses 汇总，待付佣金为总佣金减已付。支付时锁定佣金记录并检查已付及待执行计划，防止超额支付；来源键避免重复生成支出。

invoices.income_id 必须关联 incomes 中 RECEIPT 且 CONFIRMED 的记录，不得关联应收主记录。按设计稿一笔已确认收款对应同金额有效发票。非订单收入同样可以开票，通过收款明细的父记录追溯业务归属。

发票重开追加记录并关联原发票，同一收款最多一份有效发票，作废或重开不改变实际收入。发票资料保存开具时快照；PDF 放 materials 的发票文件分类，发送状态、尝试次数、最近错误及最近发送时间放 invoices；发送状态等业务字段变化作为该发票的 UPDATE 记录保存，不另建邮件事件日志。外部发送使用请求幂等键，不能假定数据库保证跨系统恰好发送一次。

### 文件与资料：一张 materials 表

每条记录直接保存资料标题、分类、正文／说明、实际文件信息和业务归属。一张图片、一份 PDF、一个视频分别是一条记录；纯文字指南可只存正文，链接资料可只存 source_url。一个订单有多个文件就保存多条关联该订单的记录，不再建 attachments，也不引入 parent_id 或资料／文件两层结构。

归属外键为 project_id、unit_id、order_id、income_id、expense_id、invoice_id、sales_company_id、user_id，恰好一个非空，由数据库约束保证；其余关联上下文通过归属业务查询。收入附件可归属应收主记录，实际收款凭证必须归属具体收款明细，发票 PDF 归属发票记录。分类与归属组合由服务校验。

项目宣传册、指南归属项目；户型图、单位照片归属单位；租赁合同、交还文件归属订单；收款／付款凭证归属对应收入明细／支出。公司证件、人员头像也可使用同一表。项目资料在单位或订单页需要展示时沿业务关系查询，不复制到每个订单，不将所有资料强制关联订单。

保留版本的资料仍使用同一表：material_group_id 标识同一份文件或文字资料的版本序列，version_no 唯一且当前版本最多一个；此分组仅用于版本，不是多附件的父子结构。普通新文件可使用独立 group 和版本 1。合同的模板关联及生成时快照保存于 template_material_id、contract_snapshot；同组版本的业务归属不允许改变。

文件存储元数据包括 storage_key、original_name、mime_type、size_bytes、checksum；文件本身放对象存储，不直接存数据库二进制。上传者和操作时间可追溯。若多个业务记录确需引用同一物理文件，可保存不同 materials 行使用同一存储键，清理前检查全部引用。

下载权限按业务归属校验；资料版本、凭证作废均保留历史，凭证作废不会撤销实际资金记录。

### 账户、配置及历史

fund_accounts 用于收付款选择及历史统计；停用保留引用，不保存银行登录凭据，不发起转账。

system_settings 保存单位类型字典、业务默认项、出具方信息等配置；合同和发票使用当时快照，服务器密钥放运行环境。

按用户确认，操作记录放在各业务表的 operation_logs 中，action 仅使用 CREATE、UPDATE、DELETE。查询、预览和下载不产生操作记录，也不扩展为独立的催缴、检视或邮件事件日志。收款确认、财务调整等改变业务状态或金额的动作属于 UPDATE，具体用途可用 reason 或 business_action 说明。

每条操作记录采用统一结构：event_id、action、actor_id、actor_name（操作时快照）、operated_at、changes、reason、operation_id。changes 仅保存发生变化的业务字段及其 before／after，不包含 operation_logs 自身，也不复制整条业务记录或文件内容。创建记录保存允许留存的初始业务字段；删除记录保存删除原因及软删除字段变化。

操作人、时间及 changes 由服务端基于已鉴权账号和实际写入内容生成，前端不得直接提交或覆盖 operation_logs。自动业务处理使用明确的系统身份。密码、密码哈希、令牌及密钥不写入日志；重置密码只记录已执行的动作，不保留密码字段值。

业务更新与日志追加采用同一条原子更新或同一事务、配合 revision／行锁。不能先读取数组再无条件全量回写，避免并发覆盖他人的记录。新建时同时写入 CREATE 日志。修改只追加日志，不提供单独编辑历史记录的接口。

为保留删除记录，业务删除采用软删除：同事务设置 deleted_at、deleted_by 并追加 DELETE，主记录及其操作历史继续存在。普通查询默认过滤软删除，查看已删除记录仍需权限；有关联数据时按业务规则限制删除或使用停用。已确认收款、已付款支出、已开具发票不能通过软删除从金额统计中消失，应使用明确的作废／退款业务流程并保留历史。

业务列表不默认返回 operation_logs；详情中按需读取本条记录的历史，按现有业务权限控制。一次操作修改多条业务记录时，各行记录自己的变动，使用同一 operation_id 关联。日志数组适用于当前每条业务记录修改次数较少的范围；本版不提供跨模块独立日志检索。

## 关键关系及数量

- sales_companies → users：公司包含个人账号。
- projects → units → orders：项目、单位及历史租赁订单。
- system_settings 的单位类型字典 → units.unit_type_code：按稳定编码引用，服务校验。
- orders（可无）→ incomes 应收主记录 → incomes 收款明细 → invoices。
- orders → commissions → expenses：佣金归属及实际支付。
- 项目／单位／订单／收入／支出／发票等 → materials：每份资料或文件直接关联其所属业务。

账号 1 + 公司 1 + 项目 1 + 单位 1 + 订单 1 + 收入 1 + 支出 1 + 佣金 1 + 发票 1 + 文件资料 1 + 资金账户 1 + 系统设置 1 = **12 张**。

## 数据库类型及必要约束

- 主键和关联键使用 uuid，事件时间使用 timestamptz，业务日期使用 date；金额使用 numeric(18,2)。固定角色、记录类型、状态使用枚举或 CHECK。
- username、业务单号、发票号唯一。单位编号在项目内唯一；同表应收／收款编号使用明确规则区分。来源事件键唯一防止重复执行。
- incomes 的父子关系限制一层，收款只能关联应收；发票只能关联已确认收款。仅有 FK 不足以保证类型，必须落实跨行约束。
- 金额、币种、实际收款余额和佣金支付余额在事务内校验并锁定主记录；银行参考号不默认全局唯一。
- 有效订单租期占用不可重叠，到期未交还的单位另行阻止入住。项目、单位报价修改不回写历史订单。
- materials 同组版本号唯一，当前版本最多一条；materials 归属外键恰好一个；有业务引用的记录限制物理删除。
- 单位类型字典的 code 唯一且稳定；服务校验引用，停用仍可展示历史，禁止删除被引用项。
- 订单修改、收款确认、财务调整与各自 operation_logs 的追加同事务提交。列表、文件下载、统计、导出均执行一致的数据权限。

不额外建独立操作记录、订单变更申请、业务主体、租客档案、独立账单、独立收款明细、单位类型、独立附件、资料版本、文件关联、独立合同、退租、佣金付款或统计汇总表。收入同表合并减少表数，但不取消应收和实际到账的业务区分。
