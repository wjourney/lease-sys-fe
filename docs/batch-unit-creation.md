# 批量创建单位

项目详情 → 批量创建单位，权限与单个单位创建一致（超级管理员、运营）。
独立页面支持房号粘贴、连续生成、前导零和前缀；默认类型和月租仅用于新增预览行，已有行可单独修改。最多 100 行，继承的期/座、楼层、面积、间隔、楼龄、价格范围只读。

接口：
- `POST /api/v1/units/batch-preview`：校验，不创建。
- `POST /api/v1/units/batch`：同一事务创建全部单位及提交记录。

请求：`{ requestId: UUID, projectId: UUID, rows: [{ unitTypeCode, roomNo, referenceRent }] }`。
类型资料只能由后端读取项目类型后填充，拒绝客户端额外字段。
业务行错误返回 `{ ok: false, issues: [{ row: 零起始索引, message }] }`；成功返回 `{ ok: true, count, unitIds }`。预检查成功无 unitIds。
每次实际创建会再次校验，项目行锁防止并发重复房号；创建失败整体回滚。历史已删除单位仍受数据库唯一约束，其房号会明确提示不能复用。

`UnitCreationBatch` 记录与单位同时提交。相同 requestId、操作者和内容重试返回原 unitIds；相同编号不同内容或操作者拒绝。前端保存未确认提交到当前浏览器会话，超时或刷新后锁定原内容，用同一编号重试，防止重复创建。

数据库变更：后端 `20261008120000_unit_creation_batch`，上线前先执行迁移。后端部署成功后再发布前端。
验证：后端纯单元测试 `test/unit-batch.test.ts`；真实并发、权限和零部分提交在 CI 专用数据库 `test/integration.test.ts` 验证。前端模拟接口浏览器测试 `tests/unit-batch.spec.ts`，不会向线上写入测试单位。
