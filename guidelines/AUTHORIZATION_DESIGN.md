# 授权交易系统 - 高保真设计文档

## 一、总体架构

### 1.1 系统定位
本系统实现"鋆寰｜非遗智作"平台的完整授权交易闭环,不新增一级菜单,功能分散到现有模块:
- **我的纹库**:卖家配置授权、入驻认证、收款绑定、结算查询
- **纹样市集**:买家浏览授权、申请购买、订单管理
- **平台后台**:运营配置规则、审核管理

### 1.2 核心原则
- **MECE法则**:功能模块相互独立、完全穷尽
- **STAR原则**:场景→任务→行动→结果
- **懒人原则**:
  - 60秒原则:快速完成认证和发布
  - 4步原则:关键流程≤4步
  - 做任务原则:红点提示待处理任务
  - 爬楼梯原则:可回退、有提示
  - 保底线原则:符合支付合规

## 二、数据模型(已完成)

### 2.1 核心接口
```typescript
// 卖家资料
interface SellerProfile {
  userId: string;
  status: 'none' | 'pending' | 'verified';
  sellerType: 'individual' | 'business' | 'enterprise';
  realName: string;
  idNumber: string;
  contactPhone: string;
  contactAddress: string;
}

// 平台协议
interface SellerAgreement {
  userId: string;
  serviceAgreement: 'unsigned' | 'signed';
  transactionRules: 'unsigned' | 'signed';
  feeRules: 'unsigned' | 'signed';
  commissionRate: number; // 10%
}

// 收款账户
interface PaymentAccount {
  userId: string;
  status: 'unbound' | 'pending' | 'verified';
  accountType: 'bank' | 'alipay';
  accountName: string;
  accountNumber: string;
}

// 授权配置
interface LicenseConfig {
  patternId: string;
  enableProject: boolean;   // 单项目授权
  enableAnnual: boolean;    // 年度授权
  enableLimited: boolean;   // 限量授权
  projectPrice: number;     // 基准价
  annualPrice: number;      // =基准价×2.5
  limitedTiers: {           // 阶梯定价
    qty100: number;
    qty500: number;
    qty1000: number;
  };
  allowDerivative: boolean; // 允许改编
  region: string;           // 授权地域
}

// 结算记录
interface Settlement {
  id: string;
  orderNo: string;
  buyerAmount: number;      // 买家实付
  commission: number;       // 平台佣金
  sellerIncome: number;     // 卖家净收入
  status: 'pending' | 'processing' | 'completed' | 'frozen';
}
```

## 三、卖家中心组件(已完成)

### 3.1 组件结构
```
SellerCenter (Drawer组件)
├── 身份认证页
│   ├── 选择卖家类型(个人/个体/企业)
│   ├── 填写身份信息
│   ├── 预览确认
│   └── 提交审核
├── 协议签署页
│   ├── 5大协议列表
│   ├── 佣金比例展示(10%)
│   ├── 重要提示
│   └── 勾选同意+签署按钮
├── 收款账户页
│   ├── 选择账户类型(支付宝/银行)
│   ├── 填写账户信息
│   ├── 第二次确认
│   └── 绑定成功
└── 结算中心页
    ├── 累计收入/待结算统计
    ├── 结算记录列表
    └── 导出对账单
```

### 3.2 入驻流程(符合4步原则)
1. 点击"卖家中心" → 弹出Drawer
2. 完成身份认证(3步子流程:选择类型→填写→确认)
3. 签署平台协议(1步)
4. 绑定收款账户(带二次确认)

### 3.3 三次确认机制
**第一次**:卖家入驻时 → 勾选《平台收费与分账规则》
**第二次**:绑定收款账户时 → 二次确认弹窗提示分账规则
**第三次**:发布纹样时 → 显示"买家支付价/平台佣金/卖家预计到账"

## 四、我的纹库页面改造

### 4.1 新增元素

#### 4.1.1 顶部增加"卖家中心"按钮
**位置**:搜索框右侧
**样式**:
```tsx
<button
  onClick={() => setSellerCenterOpen(true)}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C4912A] to-[#D4A140] text-white">
  <Store className="w-4 h-4" />
  <span className="text-sm" style={{ fontWeight: 600 }}>卖家中心</span>
  {!isSellerReady && (
    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
  )}
</button>
```

**状态提示**:
- 未完成入驻:显示脉动红点
- 已完成:无提示

#### 4.1.2 纹样详情弹窗增加"授权设置"Tab
**Tab结构**:
```
[基本信息] [确权与版权] [授权设置] [发布管理]
```

**授权设置内容**:
```tsx
<div className="space-y-4">
  {/* 前置条件检查 */}
  {!isSellerReady && (
    <Alert type="warning">
      请先完成卖家入驻(身份认证+协议签署+收款绑定)才能配置授权设置
      <button>前往卖家中心</button>
    </Alert>
  )}

  {/* 授权类型开关 */}
  <Section title="授权类型">
    <Toggle label="单项目授权" checked={enableProject} onChange={...} />
    <Toggle label="年度授权" checked={enableAnnual} onChange={...} />
    <Toggle label="限量授权" checked={enableLimited} onChange={...} />
  </Section>

  {/* 定价配置 */}
  {enableProject && (
    <Section title="单项目授权定价">
      <Input label="基准价(元)" value={projectPrice} onChange={...} />
      <Hint>适用于单一项目/单次开发/12个月/中国大陆</Hint>
    </Section>
  )}

  {enableAnnual && (
    <Section title="年度授权定价">
      <ReadOnly label="年度价(元)" value={projectPrice * 2.5} />
      <Hint>自动计算=基准价×2.5,适用于12个月内反复使用</Hint>
    </Section>
  )}

  {enableLimited && (
    <Section title="限量授权阶梯定价">
      <Input label="100件" value={limitedTiers.qty100} onChange={...} />
      <Input label="500件" value={limitedTiers.qty500} onChange={...} />
      <Input label="1000件" value={limitedTiers.qty1000} onChange={...} />
    </Section>
  )}

  {/* 权利边界 */}
  <Section title="权利边界">
    <Checkbox label="允许改编" checked={allowDerivative} onChange={...} />
    <Checkbox label="允许商用" checked={true} disabled />
    <Select label="授权地域" value={region} options={['中国大陆', '全球']} />
  </Section>

  {/* 第三次确认:发布预览 */}
  <PricePreview>
    <Row label="买家支付价" value={projectPrice} />
    <Row label="平台佣金(10%)" value={projectPrice * 0.1} color="amber" />
    <Row label="卖家预计到账" value={projectPrice * 0.9} color="green" />
    <Hint>T+7结算周期,7天无退款/争议后自动分账到您的收款账户</Hint>
  </PricePreview>

  {/* 第三次确认:勾选框 */}
  <Checkbox>
    我已知晓该纹样成交后平台将按上述规则分账结算
  </Checkbox>

  <Button onClick={handlePublish} disabled={!agreed}>
    发布到纹样市集
  </Button>
</div>
```

### 4.2 交互流程

#### 4.2.1 首次发布纹样流程(符合4步+懒人原则)
```
1. 点击纹样详情 → 进入详情弹窗
2. 点击"授权设置"Tab
   ├─ 如未入驻 → 提示前往卖家中心
   └─ 如已入驻 → 继续
3. 配置授权类型+定价+权利边界
4. 查看分账预览 → 勾选确认 → 发布
```

#### 4.2.2 错误提示(爬楼梯原则)
- 未完成入驻 → "请先完成卖家入驻"+ "前往卖家中心"按钮
- 未确权 → "请先完成纹样确权"
- 未选择授权类型 → "请至少开启一种授权类型"
- 未填写价格 → 高亮标红+聚焦到第一个空字段
- 未勾选确认 → "发布"按钮置灰

## 五、纹样市集页面改造

### 5.1 纹样详情弹窗增强

#### 5.1.1 授权方案卡片区
**位置**:纹样图片下方、基本信息上方
**布局**:横向卡片滚动

```tsx
<div className="space-y-3">
  <h3 className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>授权方案</h3>
  <div className="flex gap-3 overflow-x-auto pb-2">
    {/* 单项目授权卡片 */}
    <LicenseCard
      type="project"
      title="单项目授权"
      desc="适用于单一项目/单次开发"
      period="12个月"
      region="中国大陆"
      price={1200}
      selected={selectedType === 'project'}
      onClick={() => setSelectedType('project')}
    />

    {/* 年度授权卡片 */}
    <LicenseCard
      type="annual"
      title="年度授权"
      desc="适用于单品牌或产品线"
      period="12个月内反复使用"
      region="中国大陆"
      price={3000}
      recommended={true}
      selected={selectedType === 'annual'}
      onClick={() => setSelectedType('annual')}
    />

    {/* 限量授权卡片 */}
    <LicenseCard
      type="limited"
      title="限量授权"
      desc="适用于指定商品限量生产"
      tiers={[
        { qty: 100, price: 1200 },
        { qty: 500, price: 1800 },
        { qty: 1000, price: 2400 },
      ]}
      selected={selectedType === 'limited'}
      onClick={() => setSelectedType('limited')}
    />
  </div>
</div>
```

**卡片样式**:
- 未选中:白色背景、灰色边框
- 选中:青色背景、青色边框、右上角勾选图标
- 推荐标记:右上角金色"推荐"角标

#### 5.1.2 分账说明区
**位置**:授权方案下方
**内容**:
```tsx
<div className="p-4 rounded-xl" style={{ background: 'rgba(26,61,74,0.04)' }}>
  <div className="flex items-center gap-2 mb-2">
    <Info className="w-4 h-4 text-[#1A3D4A]" />
    <span className="text-xs text-[#1A3D4A]" style={{ fontWeight: 600 }}>结算说明</span>
  </div>
  <div className="space-y-1 text-xs text-[#6B6558]">
    <p>• 授权生效方式:卖家审核通过后,买家支付完成即生效</p>
    <p>• 退款说明:授权生效后不支持无理由退款</p>
    <p>• 平台服务:提供交易担保、争议仲裁、技术支持</p>
  </div>
</div>
```

### 5.2 申请授权抽屉增强

**底部订单摘要区**:
```tsx
<div className="border-t border-gray-200 p-4 space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-xs text-[#9B9590]">授权类型</span>
    <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>年度授权</span>
  </div>
  <div className="flex items-center justify-between">
    <span className="text-xs text-[#9B9590]">授权期限</span>
    <span className="text-sm text-[#1A3D4A]">12个月</span>
  </div>
  <div className="flex items-center justify-between">
    <span className="text-xs text-[#9B9590]">授权地域</span>
    <span className="text-sm text-[#1A3D4A]">中国大陆</span>
  </div>
  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
    <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>授权费用</span>
    <span className="text-xl text-[#C4912A]" style={{ fontWeight: 700 }}>¥3,000</span>
  </div>
  <p className="text-xs text-[#9B9590]">
    授权生效后不可转授权,不可再次上架
  </p>
</div>
```

### 5.3 订单管理增强

#### 5.3.1 卖家侧"待我处理"
**增加分账信息展示**:
```tsx
<OrderCard>
  <Header />
  <LicenseInfo />
  {/* 新增:分账预览 */}
  <FinancePreview>
    <Row label="买家支付" value={2800} />
    <Row label="平台佣金(10%)" value={280} color="amber" />
    <Row label="预计到账" value={2520} color="green" />
    <Row label="结算周期" value="T+7" />
  </FinancePreview>
  <Actions>
    <Button type="approve">同意授权</Button>
    <Button type="reject">拒绝</Button>
  </Actions>
</OrderCard>
```

#### 5.3.2 买家侧"我申请的"
**授权获得的纹样标记**:
```tsx
<PatternCard>
  {/* 右上角授权标记 */}
  <Badge className="absolute top-2 right-2" color="blue">
    授权获得
  </Badge>
  
  {/* 详情中显示授权边界 */}
  <AuthorizationLimits>
    <Item label="授权类型" value="年度授权" />
    <Item label="授权期限" value="2026-04-10 至 2027-04-10" />
    <Item label="数量限制" value="无限制" />
    <Item label="允许改编" value="是" />
    <Item label="可再次发布" value="否" color="red" />
    <Item label="可再次授权" value="否" color="red" />
  </AuthorizationLimits>
</PatternCard>
```

## 六、UI规范

### 6.1 颜色系统
```css
--color-primary: #1A3D4A;     /* 深青 */
--color-gold: #C4912A;        /* 非遗金 */
--color-success: #16A34A;     /* 成功绿 */
--color-warning: #D4900A;     /* 警告黄 */
--color-error: #DC2626;       /* 错误红 */
--color-text-primary: #1A3D4A;
--color-text-secondary: #6B6558;
--color-text-tertiary: #9B9590;
```

### 6.2 组件规范
- **圆角**: 卡片`rounded-xl`(12px), 按钮`rounded-lg`(8px)
- **阴影**: `shadow-lg`, `shadow-2xl`
- **间距**: `space-y-4`(1rem), `gap-3`(0.75rem)
- **动画**: `motion/react` framer-motion库
- **图标**: `lucide-react`
- **提示**: `sonner` toast

### 6.3 文案规范
- **品牌名**: "鋆寰｜非遗智作"
- **水印**: 
  - 管理员: "鋆寰｜非遗智作·管理员·内部专用"
  - 设计师: "鋆寰｜非遗智作·设计师·Nanjing AureusOrbis"
- **按钮**: 主动词+对象(如"发布到市集"、"签署协议")

## 七、技术实现要点

### 7.1 状态管理
```typescript
// AppContext新增
const isSellerReady = !!(
  sellerProfile?.status === 'verified' &&
  sellerAgreement?.serviceAgreement === 'signed' &&
  paymentAccount?.status === 'verified'
);
```

### 7.2 数据校验
```typescript
function validateLicenseConfig(config: LicenseConfig): string | null {
  if (!config.enableProject && !config.enableAnnual && !config.enableLimited) {
    return '请至少开启一种授权类型';
  }
  if (config.enableProject && !config.projectPrice) {
    return '请设置单项目授权价格';
  }
  if (config.enableLimited && !config.limitedTiers) {
    return '请设置限量授权阶梯价格';
  }
  return null;
}
```

### 7.3 价格计算
```typescript
function calculatePrices(basePrice: number) {
  return {
    project: basePrice,
    annual: basePrice * 2.5,
    limited: {
      qty100: basePrice * 0.6,
      qty500: basePrice * 0.9,
      qty1000: basePrice * 1.2,
    },
  };
}

function calculateSettlement(orderAmount: number, commissionRate: number = 10) {
  const commission = orderAmount * (commissionRate / 100);
  const channelFee = orderAmount * 0.006; // 支付通道费0.6%
  const sellerIncome = orderAmount - commission - channelFee;
  return { commission, channelFee, sellerIncome };
}
```

### 7.4 埋点要求
```typescript
// 关键操作埋点
trackEvent('seller_profile_verified', { userId, sellerType });
trackEvent('seller_agreement_signed', { userId, commissionRate });
trackEvent('payment_account_bound', { userId, accountType });
trackEvent('license_config_saved', { patternId, enabledTypes });
trackEvent('pattern_published', { patternId, licenseTypes, basePrice });
trackEvent('license_applied', { patternId, template, price });
trackEvent('license_approved', { orderId, sellerIncome });
trackEvent('settlement_completed', { settlementId, amount });
```

## 八、开发清单

### 8.1 已完成
- [x] AppContext数据模型扩展
- [x] SellerCenter组件创建

### 8.2 待实现
- [ ] InspirationLibraryPage改造
  - [ ] 顶部增加"卖家中心"按钮
  - [ ] 纹样详情增加"授权设置"Tab
  - [ ] 实现授权配置表单
  - [ ] 实现第三次确认机制
  - [ ] 集成SellerCenter组件

- [ ] PatternMarketPage改造
  - [ ] 纹样详情增加授权方案卡片
  - [ ] 纹样详情增加分账说明
  - [ ] 申请授权抽屉增加订单摘要
  - [ ] 订单卡片增加分账信息
  - [ ] 买家纹库增加授权边界标记

- [ ] 全局优化
  - [ ] 品牌名称更新为"鋆寰｜非遗智作"
  - [ ] 水印文字更新
  - [ ] 添加埋点
  - [ ] 添加双语支持
  - [ ] 响应式适配

## 九、测试场景

### 9.1 卖家入驻流程
1. 未认证用户点击"发布到市集" → 提示先完成入驻
2. 点击"卖家中心" → 完成身份认证 → 签署协议 → 绑定账户
3. 完成入驻后可配置授权设置
4. 发布时显示分账预览,需勾选确认

### 9.2 授权配置流程
1. 已入驻卖家选择纹样 → 点击"授权设置"
2. 开启授权类型 → 设置价格 → 配置权利边界
3. 查看分账预览 → 勾选确认 → 发布成功

### 9.3 买家购买流程
1. 浏览纹样市集 → 点击纹样详情
2. 查看授权方案 → 选择合适方案
3. 填写申请信息 → 提交申请
4. 卖家审核通过 → 买家支付
5. 授权生效 → 纹样入库(带授权边界标记)

### 9.4 结算流程
1. 买家支付成功 → 订单进入T+7结算
2. 7天后自动分账 → 卖家收款账户到账
3. 结算记录可在"结算中心"查看

## 十、上线检查清单(懒人原则-上线10要件)

- [ ] 增加/删除/修改操作有埋点log
- [ ] 有仪表盘展示PV/UV/交易数据
- [ ] 支持中英文双语
- [ ] 集成统一水印组件
- [ ] 权限申请被拒绝有提示
- [ ] 有线上客服/故障提交功能
- [ ] 主流屏幕适配完整
- [ ] 关键操作有loading反馈(≤3秒)
- [ ] 输入有缓存/结果有记忆
- [ ] 超时操作可取消+二次确认

---

**设计版本**: v1.0
**最后更新**: 2026-04-11
**设计者**: 资深系统软件产品经理 & UI/UX工程师(20+年)
