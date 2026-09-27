# 可用符文数量

## 说明&逻辑

`GetRuneCooldown(1..6)` 的 runeReady 在此已验证场景可直接计数。数量 n 映射为 RGB=(n/255,n/255,n/255)，因此字节亮度是 0～6，不是把六枚符文拉伸到 255。初始化、进入世界与 RUNE_POWER_UPDATE 刷新，无轮询。

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
local output = canvas:CreateTexture(nil, "ARTWORK")
output:SetAllPoints(canvas)
output:SetTexture("Interface\\Buttons\\WHITE8X8")
output:SetVertexColor(0, 0, 0, 1)

local CreateFrame              = CreateFrame
local CreateColor              = CreateColor
local GetRuneCooldown          = GetRuneCooldown
local After                    = C_Timer.After

local runeColors               = {}

local eventFrame               = CreateFrame("Frame")

for count = 0, 6 do
    local brightness = count / 255
    runeColors[count] = CreateColor(brightness, brightness, brightness, 1)
end

local function update()
    if not output then return end
    local readyRunes = 0
    for runeIndex = 1, 6 do
        local _, _, runeReady = GetRuneCooldown(runeIndex)
        if runeReady then readyRunes = readyRunes + 1 end
    end
    local color = runeColors[readyRunes]
    output:SetVertexColor((color):GetRGBA())
end

local function initialize()

    update()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("RUNE_POWER_UPDATE")
eventFrame:SetScript("OnEvent", function()
    After(0, update)
end)
C_Timer.After(0, initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 通道采样值  # 返回float，意义为0～6枚可用符文；需要整数时按采样质量处理
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
