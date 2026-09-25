"""Схема расстановки сил при задержании (вариант «А», открытая местность).

Запуск: python3 schema.py  ->  schema.png рядом со скриптом.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1800, 1240
S = 2  # сглаживание: рисуем в 2x и уменьшаем
img = Image.new("RGB", (W * S, H * S), "white")
d = ImageDraw.Draw(img)

FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def f(size, bold=True):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size * S)


def box(x0, y0, x1, y1, fill, outline=None, width=2, radius=0):
    d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], radius=radius * S,
                        fill=fill, outline=outline, width=width * S)


def text(x, y, s, size=22, fill="#222", bold=True, anchor="mm"):
    d.text((x * S, y * S), s, font=f(size, bold), fill=fill, anchor=anchor)


def arrow(x0, y0, x1, y1, color, width=3, head=12, dash=None):
    if dash:
        total = math.hypot(x1 - x0, y1 - y0)
        n = int(total // (dash * 2))
        for i in range(n):
            a = i * 2 * dash / total
            b = min((i * 2 + 1) * dash / total, 1)
            d.line([((x0 + (x1 - x0) * a) * S, (y0 + (y1 - y0) * a) * S),
                    ((x0 + (x1 - x0) * b) * S, (y0 + (y1 - y0) * b) * S)],
                   fill=color, width=width * S)
    else:
        d.line([(x0 * S, y0 * S), (x1 * S, y1 * S)], fill=color, width=width * S)
    ang = math.atan2(y1 - y0, x1 - x0)
    p1 = (x1 - head * math.cos(ang - 0.45), y1 - head * math.sin(ang - 0.45))
    p2 = (x1 - head * math.cos(ang + 0.45), y1 - head * math.sin(ang + 0.45))
    d.polygon([(x1 * S, y1 * S), (p1[0] * S, p1[1] * S), (p2[0] * S, p2[1] * S)], fill=color)


def fighter(x, y, label, color, face=None, size=46):
    """Квадрат-боец; face — точка, куда он «смотрит» (стрелка направления)."""
    if face:
        ang = math.atan2(face[1] - y, face[0] - x)
        r0, r1 = size * 0.55, size * 0.55 + 26
        arrow(x + r0 * math.cos(ang), y + r0 * math.sin(ang),
              x + r1 * math.cos(ang), y + r1 * math.sin(ang), INK, width=3, head=11)
    h = size / 2
    box(x - h, y - h, x + h, y + h, color, outline=INK, width=2, radius=6)
    text(x, y + 1, label, size=19, fill="white" if color in ("#262626", "#6e6e6e") else INK)


def person(x, y, label, color, r=30):
    dark = color.lower() in ("#000000", "#262626")
    d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=color, outline=INK, width=3 * S)
    text(x, y + 1, label, size=22, fill="white" if dark else INK)


def diamond(x, y, label, color="#111", r=34):
    pts = [(x, y - r), (x + r, y), (x, y + r), (x - r, y)]
    d.polygon([(px * S, py * S) for px, py in pts], fill=color)
    text(x, y + 1, label, size=16, fill="white")


C_OBJ, C_CL, C_Z, C_P, C_B, C_KV, C_S = "#000000", "#ffffff", "#262626", "#6e6e6e", "#a6a6a6", "#ffffff", "#ffffff"
INK = "#000000"

# --- местность ---------------------------------------------------------------
box(40, 40, 1760, 200, "#e9e9e9", outline="#9a9a9a", width=2)          # здание
text(220, 120, "ЗДАНИЕ", 26, "#6b6b6b")
box(1290, 170, 1430, 200, "#4d4d4d")                                   # дверь
text(1360, 140, "Вход", 22, "#333333")
box(40, 200, 1760, 420, "#f4f4f4")                                     # тротуар
text(1650, 400, "тротуар", 18, "#9e9e9e", bold=False)
box(40, 420, 1760, 800, "#d9d9d9")                                     # проезжая часть
for x in range(60, 1760, 90):                                          # разметка
    box(x, 667, x + 50, 673, "white")
text(1650, 780, "проезжая часть", 18, "#8a8a8a", bold=False)
box(40, 800, 1760, 880, "#f4f4f4")                                     # тротуар напротив

# --- транспорт -------------------------------------------------------------------
box(470, 448, 700, 540, "#3a3a3a", radius=10)
text(585, 482, "БУС-2", 24, "white"); text(585, 515, "водитель", 16, "#cfd8dc", bold=False)
box(740, 452, 960, 536, "white", outline=INK, width=3, radius=14)
text(850, 494, "ТС объекта", 20, INK)
box(1000, 448, 1230, 540, "#3a3a3a", radius=10)
text(1115, 482, "БУС-1", 24, "white"); text(1115, 515, "водитель", 16, "#cfd8dc", bold=False)

# --- объект и клиент --------------------------------------------------------------
O = (860, 320)
person(*O, "О", C_OBJ)
person(1030, 320, "Кл", C_CL)

# --- захват (внутреннее кольцо) --------------------------------------------------
fighter(785, 268, "1", C_Z, face=O)
fighter(785, 372, "2", C_Z, face=O)
fighter(935, 262, "3", C_Z, face=O)
fighter(945, 380, "4", C_Z, face=(1030, 320))

# --- прикрытие (среднее кольцо, лицом к объекту) --------------------------------
fighter(640, 250, "П1", C_P, face=O)
fighter(640, 385, "П2", C_P, face=O)
fighter(1160, 250, "П3", C_P, face=O)
fighter(1170, 385, "П4", C_P, face=(1360, 200))

# --- блокирование (внешнее кольцо, лицом наружу) --------------------------------
fighter(300, 300, "Б1", C_B, face=(40, 300))
fighter(1470, 300, "Б2", C_B, face=(1760, 300))
fighter(1360, 245, "Б3", C_B, face=(1360, 170))
fighter(300, 610, "Б4", C_B, face=(40, 610))
fighter(1470, 610, "Б5", C_B, face=(1760, 610))
fighter(860, 740, "Б6", C_B, face=(860, 840))

# --- конвой у БУС-1, командир, наблюдение ----------------------------------------
fighter(1060, 600, "Кв1", C_KV)
fighter(1120, 600, "Кв2", C_KV)
fighter(1180, 600, "Кв3", C_KV)
diamond(520, 320, "КГЗ")
person(520, 840, "С", C_S, r=26)
text(520, 790, "наблюдение /", 16, INK, bold=False)
text(520, 808, "видеозапись", 16, INK, bold=False)

# маршруты выдвижения захвата из бусов
arrow(700, 470, 770, 395, INK, width=3, head=14, dash=9)
arrow(1000, 470, 950, 405, INK, width=3, head=14, dash=9)

# --- легенда ---------------------------------------------------------------------
box(40, 900, 1760, 1215, "#ffffff", outline="#7f7f7f", width=2, radius=8)
items = [
    ("person", C_OBJ, "О", "объект"),
    ("person", C_CL, "Кл", "Клиент (подставной)"),
    ("diamond", "#111", "КГЗ", "командир группы захвата"),
    ("sq", C_Z, "1–4", "захват — бойцы № 1–4"),
    ("sq", C_P, "П", "прикрытие — 4"),
    ("sq", C_B, "Б", "блокирование — 6"),
    ("sq", C_KV, "Кв", "конвой — 3"),
    ("bus", "#3a3a3a", "", "бус + водитель — 2"),
    ("person", C_S, "С", "наблюдение / видео"),
]
cols = [90, 690, 1250]
for i, (kind, col, lab, desc) in enumerate(items):
    cx = cols[i % 3]
    cy = 948 + (i // 3) * 64
    if kind == "person":
        person(cx, cy, lab, col, r=24)
    elif kind == "diamond":
        diamond(cx, cy, lab, col, r=28)
    elif kind == "sq":
        w = 30 if len(lab) > 2 else 22
        box(cx - w, cy - 22, cx + w, cy + 22, col, outline=INK, width=2, radius=6)
        text(cx, cy + 1, lab, 16 if len(lab) > 2 else 18, "white" if col in ("#262626", "#6e6e6e") else INK)
    else:
        box(cx - 34, cy - 20, cx + 34, cy + 20, col, radius=6)
    text(cx + 50, cy, desc, 23, INK, bold=False, anchor="lm")
arrow(60, 1150, 140, 1150, INK, width=3, head=12, dash=8)
text(160, 1150, "выдвижение из бусов по команде «РЕАЛИЗАЦИЯ»", 21, INK, bold=False, anchor="lm")
arrow(1000, 1150, 1060, 1150, INK, width=3, head=12)
text(1080, 1150, "направление контроля бойца", 21, INK, bold=False, anchor="lm")
text(900, 1192, "Бойцы 1–3 работают по объекту, боец 4 — по Клиенту (ГЗ укладывает всех, Клиента не выделяет).", 19, "#333333", bold=False)

out = Path(__file__).with_name("schema.png")
img.resize((W, H), Image.LANCZOS).save(out, optimize=True)
print("saved", out)
