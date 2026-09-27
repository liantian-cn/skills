# 沸点事件倒计时

## 说明&逻辑

`spec_boiling_point` 表达血DK沸点的事件触发时间窗口。监听 `SPELL_UPDATE_COOLDOWN`，先通过 `issecretvalue(spellID)` 排除秘密值，再匹配普通 ID `1265982`。匹配后设置 `deadline = GetTime() + 3`；重复匹配重新开始。它不是查询技能冷却或真实光环剩余时间，也不需要 DurationObject 或颜色曲线。

每 0.1 秒根据截止时间计算剩余秒数，不按回调次数递减，避免卡顿造成累计计时误差。取 `ceil(remaining * 10)` 得到 0～30 的整数，以 RGB=(整数/255,整数/255,整数/255) 显示。初始和到期为黑色，3 秒对应字节灰度 30；进入世界清除截止时间。向上取整使尚未到期的正数不会被量化为零，量化高估小于 0.1 秒，显示还受刷新间隔及卡顿影响。

无关 ID、普通 nil 和秘密 ID 都忽略，不改变已有窗口。不读取秘密光环数据，也不通过显示结果在 Lua 中反读秘密值。零值不能区分未触发、到期、重载和进入世界后的清零。若事件缺失或其 ID 是秘密值，无法恢复真实状态；同一 ID 的其他冷却更新也会重置窗口。

## Lua代码块

```lua
-- 独立示例：UI 单位尺寸；接入方负责物理像素对齐。
local SPELL_ID, DURATION = 1265982, 3
local deadline, elapsedTime = 0, 0
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(4, 4)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
local output = canvas:CreateTexture(nil, "ARTWORK")
output:SetAllPoints(canvas)
output:SetTexture("Interface\\Buttons\\WHITE8X8")

local function Refresh()
    local remaining = math.max(0, math.min(DURATION, deadline - GetTime()))
    local brightness = math.ceil(remaining * 10) / 255
    output:SetVertexColor(brightness, brightness, brightness, 1)
end

canvas:RegisterEvent("PLAYER_ENTERING_WORLD")
canvas:RegisterEvent("SPELL_UPDATE_COOLDOWN")
canvas:SetScript("OnEvent", function(_, event, spellID)
    if event == "PLAYER_ENTERING_WORLD" then
        deadline = 0
    else
        if issecretvalue(spellID) or spellID ~= SPELL_ID then return end
        deadline = GetTime() + DURATION
    end
    elapsedTime = 0
    Refresh()
end)
canvas:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 0.1 then
        elapsedTime = elapsedTime % 0.1
        Refresh()
    end
end)
Refresh()
```

## 解析

输入为色块内部稳定区域的 RGB 像素；三个通道相同，可取通道均值。采样值是 0～255 的字节亮度，不是已经归一化的比例。

```text
brightness = mean(色块内部RGB像素)
if brightness < 0 or brightness > 30:
    return 无效采样
return brightness / 10.0  # float，单位秒，范围0～3
```

理想灰度 30、21、1、0 分别还原为 3.0、2.1、0.1、0.0 秒。无需在 Python 再取整；非均匀颜色等异常按接入方采样规则处理，不能将异常自动解释成到期。此属性使用直接线性整数编码，不使用通用冷却或光环时长曲线。

## 来源与适用边界

这是对已审阅事件计时逻辑的时间戳改写，并增加进入世界清零。原逻辑使用每秒递减三次的定时器；本例采用 0.1 秒刷新及十分之一秒编码。源码分析不证明当前客户端每次都会为实际沸点回响产生该非秘密事件，也不证明所有同 ID 冷却更新都代表新的回响。

新增实现与独立示例均需游戏内核验事件对应关系、重复触发、进入世界重置、到期及像素采样；不能继承其他属性的已验证结论。来源路径与版本线索见 [维护记录](../MAINTENANCE.md#沸点事件倒计时)。
