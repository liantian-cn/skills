# 光环持续时间转为色块

## 说明&逻辑

`AuraContainer` 的 `SetDurationText` 把剩余时间绑定到字体颜色曲线。`C_DurationUtil.CreateDurationTextBinding` 配合 RemainingDuration，显示固定 U+2588 方块而非格式化数字；字体只锚定中心、不限制文字框宽高，槽位裁剪足够大的完整字形。使用包含该字形的字体并检查实际覆盖。

槽内白底：永久光环的零时长文本为空，露出白色；限时到期仍显示方块，以0秒黑色覆盖白底；光环消失后槽隐藏，露出外层黑底。曲线秒数0/15/30/60/240 → 亮度0/150/180/210/255。白色不能区分永久和≥240秒，黑色不能区分不存在和到期。日常文本、颜色和光环显隐由原生绑定更新。

### 在256阶内分配精度

临近到期通常需要更细的判断，而很长的剩余时间可以粗略表示。本例把颜色间隔集中在短时区间：

| 剩余秒数区间 | 亮度变化 | 可分配的颜色间隔数 | 每阶对应秒数 |
| --- | --- | --- | --- |
| 0～15 | 0→150 | 150 | 0.1 |
| 15～30 | 150→180 | 30 | 0.5 |
| 30～60 | 180→210 | 30 | 1 |
| 60～240 | 210→255 | 45 | 4 |

这里仍然只有256阶、255个间隔，没有增加通道信息容量；细化短时区间的代价是长时区间更粗。每阶秒数是理想步长，不能等同于实际截图的测量准确度。可按需求调整节点与上限，但必须保持单调并同步修改反插值，仍需说明永久、缺失、到期和饱和端点的含义。

### 单位与来源限定

已验证示例为玩家 HELPFUL|PLAYER。迁移到其他单位需沿用 aura-presence.md 的身份门控和单位切换事件：可协助侧增益／不可协助侧减益，保留 PLAYER 来源限定。不能据此泛化到敌方任意增益或友方任意减益。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 4, 4
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)
local BLACK = CreateColor(0, 0, 0, 1)
local WHITE = CreateColor(1, 1, 1, 1)

local AuraRemaining = C_CurveUtil.CreateColorCurve()
AuraRemaining:SetType(Enum.LuaCurveType.Linear)
AuraRemaining:AddPoint(0, CreateColor(0 / 255, 0 / 255, 0 / 255, 1))
AuraRemaining:AddPoint(15, CreateColor(150 / 255, 150 / 255, 150 / 255, 1))
AuraRemaining:AddPoint(30, CreateColor(180 / 255, 180 / 255, 180 / 255, 1))
AuraRemaining:AddPoint(60, CreateColor(210 / 255, 210 / 255, 210 / 255, 1))
AuraRemaining:AddPoint(240, CreateColor(255 / 255, 255 / 255, 255 / 255, 1))

local ipairs                  = ipairs

local CreateFrame             = CreateFrame
local After                   = C_Timer.After
local GameFontNormal          = GameFontNormal
local CreateDurationTextBinding = C_DurationUtil.CreateDurationTextBinding
local RemainingDuration       = Enum.DurationTextBindingProperty.RemainingDuration

local AURA_IDS                = { 195181 }
local CHARACTER               = "█"
local eventFrame              = CreateFrame("Frame")
local container

local function Refresh()
    if not container then
        return
    end
    container:UpdateAllAuras()
end

local function Initialize()

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel((canvas:GetFrameLevel() + 1))
    container:SetUnit("player")

    local includeSpellIDs = {}
    for _, spellID in ipairs(AURA_IDS) do
        includeSpellIDs[spellID] = true
    end
    container:AddAuraSlot("aura", "HELPFUL|PLAYER", {
        candidateFilters = { includeSpellIDs = includeSpellIDs },
        initializeFrame = function(frame)
            frame:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
            frame:SetPoint("TOPLEFT", container, "TOPLEFT")
            frame:SetFrameLevel((container:GetFrameLevel() + 1))
            frame:SetClipsChildren(true)

            local color = WHITE
            local background = frame:CreateTexture(nil, "BACKGROUND")
            background:SetAllPoints(frame)
            background:SetTexture("Interface\\Buttons\\WHITE8X8")
            background:SetVertexColor(color:GetRGBA())

            local fontPath = GameFontNormal:GetFont()
            local text = frame:CreateFontString(nil, "ARTWORK")
            text:SetFont(fontPath, (DISPLAY_HEIGHT * 3), "")

            text:SetPoint("CENTER", frame, "CENTER", 0, 0)
            text:SetJustifyH("CENTER")
            text:SetJustifyV("MIDDLE")
            text:SetShadowOffset(0, 0)
            text:SetShadowColor(0, 0, 0, 0)
            text:SetTextColor(color:GetRGBA())

            local binding = CreateDurationTextBinding()
            binding:SetZeroDurationText("")

            binding:SetExpiredText(CHARACTER)
            frame:SetDurationText(text, {
                binding = binding,
                textFormat = { formatString = CHARACTER, components = {} },
                textColor = { curve = AuraRemaining, property = RemainingDuration },
            })
        end,
    })
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:SetScript("OnEvent", function()
    After(0, Refresh)
end)
C_Timer.After(0, Initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 插值(通道采样值, [0,150,180,210,255], [0,15,30,60,240])
# 输出秒数估计；240含永久和上限饱和，0含不存在／到期。
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
