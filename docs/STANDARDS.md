# 工程化与代码规范及测试白皮书 (STANDARDS)

| 规范类型 | 规范约定与工具链 |
| :--- | :--- |
| 代码风格 | Prettier + ESLint (Vue 3 + TypeScript 严格规范) |
| 提交标准 | Conventional Commits + Commitlint |
| 自动化测试 | Vitest (单测覆盖核心 Store、状态机与适配器逻辑) |
| 质量门禁 | 每个阶段必须跑通 `test` 与 `lint` 才能进入 Code Review |

---

## 1. Git 提交规范 (Commitlint Convention)

本项目强制执行统一的语义化提交规范，遵循格式：
```text
<type>(<scope>): <subject>
```

### 1.1 常用 Type 说明
* `feat`: 新功能开发（如：`feat(gate): 完成4#304门禁与角色认领状态机`）
* `fix`: 修复缺陷（如：`fix(feed): 修复匿名模式下作者头像泄露问题`）
* `docs`: 文档变更（如：`docs(spec): 更新TECH_SPEC中Post实体定义`）
* `style`: 代码格式与排版调整（不影响业务逻辑）
* `refactor`: 重构（非新增功能且非修复 Bug 的代码变动）
* `perf`: 性能优化（如图片无损压缩优化）
* `test`: 增加或重构单元测试
* `chore`: 构建配置、依赖包升级等琐碎变动

---

## 2. 自动化测试规范 (Testing Specification)

### 2.1 必须覆盖的测试层级
1. **数据适配器测试 (`tests/unit/storage.spec.ts`)**：
   - 验证 `MockStorageAdapter` 的增删改查。
   - 验证多租户隔离断言：非本寝室用户无法通过 API 获取该寝室数据。
2. **状态机与业务 Store 测试 (`tests/unit/room.spec.ts`, `tests/unit/post.spec.ts`)**：
   - 验证 `4#304` 门禁与密钥匹配逻辑。
   - 验证满员 (6人) 物理闭门拦截逻辑。
   - 验证角色认领唯一性（不可重复认领已占用的角色）。
   - 验证 `[来吐槽吧]` 匿名树洞遮蔽逻辑（作者名称是否强制变为“神秘室友”）。
3. **工具函数纯度测试 (`tests/unit/utils.spec.ts`)**：
   - 相对时间格式化、转盘角度计算、图片体积校验。

### 2.2 运行指令
```bash
pnpm test        # 执行自动化测试套件
pnpm test:run    # 单次运行测试套件并输出报告
```

---

## 3. 代码审查规范 (Code Review Checklist)

在每个子模块进入 Code Review 环节时，必须核对以下 5 项指标：
1. **[规范性]** 是否符合 Vue 3 `<script setup>` 风格，有无未清除的无用 `console.log`。
2. **[安全性]** 多租户字段 `dormId` 是否正确透传，有无跨寝室数据访问漏洞。
3. **[防呆性]** 边界处理：空列表、长文本溢出、非法图片大小是否有兜底阻断。
4. **[测试度]** 本模块对应的新增逻辑是否有对应的 Vitest 单元测试覆盖。
5. **[构建性]** `pnpm test` 结果是否为 100% 通过（0 failed）。
