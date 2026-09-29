# 光环层数转为灰度单格

## 说明&逻辑

在 AuraContainer 的槽初始化中创建 FontString，通过 `SetApplicationCount(text, { formatter = formatter })` 绑定原生数值规则格式器。光环层数由原生绑定送入格式器；Lua 不读取秘密 AuraData，也不比较或计算层数。

这里由原生绑定消费层数，不在插件回调中调用 `formatter:FormatNumber(secretValue)`。后者要求 `AllowedWhenUntainted`，不能与绑定路径互换；充能和可施法次数的单格文档使用另一条 `string.format → SetText` 路径。

`CreateNumericRuleFormatter()` 构造开销较高，项目接入时在共享初始化位置创建一次并设置规则，供使用相同 R=G=B 编码的光环槽引用；不要在刷新或每个槽的初始化回调里反复创建。下面两个独立示例各自初始化一次；合并使用时可共享同一实例。

日常层数与显隐由原生容器更新，不增加轮询。无光环时槽隐藏，露出外层黑底。无光环、无堆叠计数与零计数无法仅凭黑色区分；255 与更大计数都显示白色。不使用按最大层数缩放的比例，1 层就是灰度字节 1。

两段代码是独立示例，选一段放入已加载的插件 Lua 文件即可；若同时使用需调整显示位置。玩家示例显示 `HELPFUL|PLAYER`，目标/焦点示例显示不可协助侧的 `HARMFUL|PLAYER`。PLAYER 来源范围包含玩家宠物/载具，不能等同只来自角色本人；不可协助也不保证可攻击。单槽多个 ID 由容器选中其中一个，不汇总层数。

### 灰度编码与秘密值

初始化时生成 256 条固定文本规则：阈值 n 对应颜色码 `|cFFnnnnnn█|r`，其中每个 nn 是 n 的两位十六进制。循环变量是普通数字，实际秘密计数只交给原生格式器。没有用秘密数值执行 Lua 比较、算术、表索引或 `string.format`。

R=G=B 的颜色字节都等于输出计数，0 为黑色、1 为灰度 1、254 为灰度 254；255 及更大计数沿用最高阈值的白色规则。这里采用非负整数输入，不提供负数或小数编码语义。无需额外控件钳制，也不需要在规则中设置 `max`：最后一条输出文本本来就是固定白色。

把实心字形放大并居中，只让小格子保留其内部区域。文字不设置会截断字形的窄宽高，关闭阴影，并允许内嵌颜色码生效。4×4 是示例尺寸；1×1 物理像素也可以表达同一灰度，但必须确保字形完全覆盖采样位置。1 层只比黑色亮一个字节，人眼几乎看不出，不代表没有数值。

## Lua代码块

### 玩家增益层数

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，接入时负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 4, 4
local CHARACTER = "█"
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
canvas:SetClipsChildren(true)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)

-- 初始化时只使用普通循环变量，不在 Lua 中处理秘密计数。
local formatter = C_StringUtil.CreateNumericRuleFormatter()
local rules = {}
for count = 0, 255 do
    rules[#rules + 1] = {
        threshold = count,
        format = string.format("|cFF%02X%02X%02X%s|r",
            count, count, count, CHARACTER),
    }
end
formatter:SetBreakpoints(rules)

local UNIT_TOKEN = "player"
local AURA_IDS = { 195181 }
local container
local eventFrame = CreateFrame("Frame")

local function Refresh()
    if container == nil then return end
    container:UpdateAllAuras()
end

local function Initialize()
    if not C_AddOns.IsAddOnLoaded("Blizzard_AuraContainer") then
        C_AddOns.LoadAddOn("Blizzard_AuraContainer")
    end
    if not C_AddOns.IsAddOnLoaded("Blizzard_AuraContainer") then
        error("未能加载 Blizzard_AuraContainer，无法绑定光环层数")
    end

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel(canvas:GetFrameLevel() + 1)
    container:SetUnit(UNIT_TOKEN)

    local includeSpellIDs = {}
    for _, spellID in ipairs(AURA_IDS) do
        includeSpellIDs[spellID] = true
    end
    container:AddAuraSlot("aura", "HELPFUL|PLAYER", {
        candidateFilters = { includeSpellIDs = includeSpellIDs },
        initializeFrame = function(frame)
            frame:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
            frame:SetPoint("TOPLEFT", container, "TOPLEFT")
            frame:SetFrameLevel(container:GetFrameLevel() + 1)
            frame:SetClipsChildren(true)
            local text = frame:CreateFontString(nil, "ARTWORK", "GameFontNormal")
            text:SetPoint("CENTER", frame, "CENTER")
            text:SetJustifyH("CENTER")
            text:SetJustifyV("MIDDLE")
            text:SetFontHeight(88)
            text:SetTextColor(1, 1, 1, 1)
            text:SetShadowOffset(0, 0)
            text:SetFixedColor(false)
            frame:SetApplicationCount(text, { formatter = formatter })
        end,
    })
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:SetScript("OnEvent", function()
    C_Timer.After(0, Refresh)
end)
C_Timer.After(0, Initialize)
```

### 目标或焦点减益层数

默认 target；将本段 `UNIT_TOKEN` 改为 focus 即使用焦点，代码已包含对应切换事件和单位门控。示例其余部分不依赖上一段。

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，接入时负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 4, 4
local CHARACTER = "█"
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
canvas:SetClipsChildren(true)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)

-- 初始化时只使用普通循环变量，不在 Lua 中处理秘密计数。
local formatter = C_StringUtil.CreateNumericRuleFormatter()
local rules = {}
for count = 0, 255 do
    rules[#rules + 1] = {
        threshold = count,
        format = string.format("|cFF%02X%02X%02X%s|r",
            count, count, count, CHARACTER),
    }
end
formatter:SetBreakpoints(rules)

local UNIT_TOKEN = "target" -- 可改为 "focus"，下方自动注册焦点切换事件。
local AURA_IDS = { 55078 }
local container
local eventFrame = CreateFrame("Frame")

local function Refresh()
    if container == nil then return end
    -- 只门控普通单位信息；不可协助不等于可攻击。
    local allowed = UnitExists(UNIT_TOKEN)
        and not UnitCanAssist("player", UNIT_TOKEN, true, true)
    container:SetShown(allowed)
    container:UpdateAllAuras()
end

local function Initialize()
    if not C_AddOns.IsAddOnLoaded("Blizzard_AuraContainer") then
        C_AddOns.LoadAddOn("Blizzard_AuraContainer")
    end
    if not C_AddOns.IsAddOnLoaded("Blizzard_AuraContainer") then
        error("未能加载 Blizzard_AuraContainer，无法绑定光环层数")
    end

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel(canvas:GetFrameLevel() + 1)
    container:SetUnit(UNIT_TOKEN)

    local includeSpellIDs = {}
    for _, spellID in ipairs(AURA_IDS) do
        includeSpellIDs[spellID] = true
    end
    container:AddAuraSlot("aura", "HARMFUL|PLAYER", {
        candidateFilters = { includeSpellIDs = includeSpellIDs },
        initializeFrame = function(frame)
            frame:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
            frame:SetPoint("TOPLEFT", container, "TOPLEFT")
            frame:SetFrameLevel(container:GetFrameLevel() + 1)
            frame:SetClipsChildren(true)
            local text = frame:CreateFontString(nil, "ARTWORK", "GameFontNormal")
            text:SetPoint("CENTER", frame, "CENTER")
            text:SetJustifyH("CENTER")
            text:SetJustifyV("MIDDLE")
            text:SetFontHeight(88)
            text:SetTextColor(1, 1, 1, 1)
            text:SetShadowOffset(0, 0)
            text:SetFixedColor(false)
            frame:SetApplicationCount(text, { formatter = formatter })
        end,
    })
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
if UNIT_TOKEN == "target" then
    eventFrame:RegisterEvent("PLAYER_TARGET_CHANGED")
elseif UNIT_TOKEN == "focus" then
    eventFrame:RegisterEvent("PLAYER_FOCUS_CHANGED")
end
eventFrame:RegisterUnitEvent("UNIT_FACTION", "player", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_FLAGS", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function()
    C_Timer.After(0, Refresh)
end)
C_Timer.After(0, Initialize)
```

## 解析

输入是已取得的格子图像，以下为 Python 风格伪代码，不包含截图或定位框架。颜色通道使用 0～255 字节尺度；若输入已经归一化到 0～1，先乘以 255。单个物理像素直接读取该像素；较大格子读取已确认不含边缘的内部区域。

```text
region = 已确认由实心字符覆盖的有效采样区域
if region 为空:
    return 无效采样

# 按采样来源明确 RGB/BGR 顺序，只读取颜色通道，不计 alpha。
r, g, b = region 各颜色通道的均值
if max(r, g, b) - min(r, g, b) > 通道容差:
    return 无效采样

gray = (r + g + b) / 3
count = floor(gray + 0.5)
if count < 0 or count > 255:
    return 无效采样
return count  # 255 表示至少 255；0 的业务歧义见上文
```

容差由接入环境校准；理想纯色输入可取 0。三个通道相等只能排除部分异常，不能检测共同的亮度偏移。抗锯齿、透明度、颜色变换或其他覆盖可能改变输出，因此需检查实际渲染。不要再除以 255 当作计数，不要按白像素比例计算，也无需 OCR。

| 实际非负整数 | 显示 RGB 字节 | 解析输出 |
| ---: | --- | ---: |
| 0 | (0, 0, 0) | 0 |
| 1 | (1, 1, 1) | 1 |
| 254 | (254, 254, 254) | 254 |
| 255 | (255, 255, 255) | 255 |
| 256 | (255, 255, 255) | 255 |

## 来源与适用边界

本篇是独立灰度改写，完整 Lua 可放入已加载的插件文件，无需加载其他 reference 的代码；未包含插件 TOC。要求客户端提供所用格式器、文字接口及相应数据 API。字体必须包含 U+2588 实心字形。

本次静态校验不等于游戏内验收。应实际检查秘密状态下的显示、0/1/254/255/256、缺失数据与状态切换，以及不同 UI 缩放下的纯色覆盖。原始实现的使用结果不能自动扩展为本篇改写的实测结论。

仅追溯时读取 [单格计数来源记录](../MAINTENANCE.md#灰度单格计数来源)；日常理解与使用无需读取原工程。

光环示例要求 `Blizzard_AuraContainer`、`CustomAuraContainerTemplate` 和 `SetApplicationCount`。验收时还要检查光环新增/层数变化/消失、永久光环，以及目标与焦点切换、单位友敌关系变化。仅在存在可访问且匹配筛选的光环时显示，不扩展到任意受限制光环。
