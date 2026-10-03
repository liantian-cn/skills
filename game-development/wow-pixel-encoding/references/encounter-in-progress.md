# 是否处于遭遇战

## 说明&逻辑

直接读取 `C_InstanceEncounter.IsEncounterInProgress()`，返回布尔值：游戏判定遭遇战正在进行时显示白色，否则显示黑色。无需 encounterID 或首领映射表，未收录的首领同样按 API 返回值显示。

这是游戏的遭遇战状态，不等同于玩家战斗状态；普通小怪战斗不会仅因玩家进入战斗而变白。玩家死亡、换目标或没有目标时，不额外清零，仍以 API 返回值为准。也不通过 boss 单位存在推断遭遇战。

初始化立即查询；监听 `PLAYER_ENTERING_WORLD` 和 `ENCOUNTER_STATE_CHANGED`，经 `C_Timer.After(0, Update)` 延后刷新，并每秒查询一次兜底。重载或进入世界时重新读取当前状态，不依赖此前是否收到 `ENCOUNTER_START`，也不强制清零。沿用随机初始相位，首次兜底查询可能在初始化后 1～2 秒发生；初始化和事件刷新不等待该轮询。

API 声明返回非 nil 的 bool，未声明秘密返回。示例仍通过 `C_CurveUtil.EvaluateColorFromBoolean` 原生转为颜色，直接交给纹理，不在 Lua 中通过颜色反读状态。

## Lua代码块

独立放入已加载的插件 Lua 文件；尺寸和偏移为 UI 单位，物理像素对齐由接入项目负责。

```lua
local CreateFrame = CreateFrame
local After = C_Timer.After
local IsEncounterInProgress = C_InstanceEncounter.IsEncounterInProgress
local EvaluateColorFromBoolean = C_CurveUtil.EvaluateColorFromBoolean
local WHITE = CreateColor(1, 1, 1, 1)
local BLACK = CreateColor(0, 0, 0, 1)

local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(4, 4)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)
local output = canvas:CreateTexture(nil, "ARTWORK")
output:SetAllPoints(canvas)
output:SetTexture("Interface\\Buttons\\WHITE8X8")
output:SetVertexColor(0, 0, 0, 1)

local function Update()
    local color = EvaluateColorFromBoolean(IsEncounterInProgress(), WHITE, BLACK)
    output:SetVertexColor(color:GetRGBA())
end

canvas:RegisterEvent("PLAYER_ENTERING_WORLD")
canvas:RegisterEvent("ENCOUNTER_STATE_CHANGED")
canvas:SetScript("OnEvent", function()
    After(0, Update)
end)

local elapsedTime = -math.random()
canvas:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 1 then
        elapsedTime = elapsedTime % 1
        Update()
    end
end)
Update()
```

## 解析

输入为已截取的稳定内部 RGB 区域，各通道范围为 0～255。白色输出 true，黑色输出 false；不使用编号、百分比或灰度计数解析。

```text
if 区域全部通道均为255:
    encounter_in_progress = True
elif 区域全部通道均为0:
    encounter_in_progress = False
else:
    标记采样无效，由接入项目处理
```

项目若复用严格全白判定，异常像素也可能解码成 false；这属于解码器策略，不代表游戏已结束遭遇战。通用采样约定见 [采样与解析](../SKILL.md#采样与解析约定)。

## 来源与适用边界

要求客户端提供上述 API 和事件；不增加旧客户端兼容分支。这里只输出状态，不包含截图定位或动作执行。

API 声明与源实现核对不等于游戏内验收。需在客户端确认非遭遇战、小怪战斗、遭遇战开始／结束、战中重载，以及玩家死亡但遭遇战继续时的显示和解码。来源和验证记录见 [维护指南](../MAINTENANCE.md#遭遇战布尔状态)。
