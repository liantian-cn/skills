# 普通技能 ID 的图标与异步加载

## 说明&逻辑

普通静态技能 ID 经 `GetSpellTexture` 取得纹理并显示。首次请求一次 RequestLoadSpellData，成功加载事件触发重绘，设置失败则清空显示。此处普通纹理可判断 SetTexture 返回值，不要把该判断复制到秘密施法纹理路径。同一纹理可能对应多个技能，图标不能天然唯一识别技能。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 8, 8
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
local icon = canvas:CreateTexture(nil, "ARTWORK")
icon:SetAllPoints(canvas)
icon:Hide()

local SPELL_ID = 47528 -- 普通静态ID；此例不接收秘密的当前施法ID
local eventFrame = CreateFrame("Frame")
local function Render()
    icon:Hide()
    local texture = C_Spell.GetSpellTexture(SPELL_ID)
    -- 仅在普通静态ID路径判断纹理和SetTexture返回值。
    if texture and icon:SetTexture(texture) then
        icon:Show()
    end
end
eventFrame:RegisterEvent("SPELL_DATA_LOAD_RESULT")
eventFrame:SetScript("OnEvent", function(_, _, spellID, success)
    if success and spellID == SPELL_ID then
        C_Timer.After(0, Render)
    end
end)
C_Timer.After(0, function()
    C_Spell.RequestLoadSpellData(SPELL_ID) -- 请求一次，不循环重试
    Render()
end)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
if 图标内部区域.是黑色:
    return 无图标
return 固定算法指纹(图标内部区域的连续RGB字节)
# 与同尺寸、同裁剪、同渲染条件下采集的图标匹配；不从指纹直接推导技能ID。
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
