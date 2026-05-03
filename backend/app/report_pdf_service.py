from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageColor, ImageDraw, ImageFilter, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas

from app.models import ReportCardDto

REPORT_PAGE_WIDTH = 1240
REPORT_PAGE_HEIGHT = 1754
REPORT_PAGE_PADDING = 72
REPORT_PAGE_FOOTER_HEIGHT = 56
REPORT_CARD_GAP = 28
REPORT_CARD_RADIUS = 30
REPORT_CARD_WIDTH = REPORT_PAGE_WIDTH - REPORT_PAGE_PADDING * 2

BACKGROUND_WARM = "#FCFEFC"
CARD_ACCENT = "#EEF8F1"
TEXT_PRIMARY = "#102114"
TEXT_SECONDARY = "#4E6556"
TEXT_MUTED = "#6C8273"
BORDER = "#D8E6DD"
ACTION_PRIMARY = "#2F8F5B"
GLOW = "#BFE9D1"
WHITE = "#FFFFFF"
SHADOW_DARK = (16, 33, 20, 30)
SHADOW_SOFT = (16, 33, 20, 20)

FONT_CANDIDATES = [
    (
        Path("/Library/Fonts/Arial Unicode.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
    ),
    (
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    ),
    (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ),
]


@dataclass
class FontPack:
    regular: ImageFont.FreeTypeFont | ImageFont.ImageFont
    medium: ImageFont.FreeTypeFont | ImageFont.ImageFont
    semibold: ImageFont.FreeTypeFont | ImageFont.ImageFont
    bold: ImageFont.FreeTypeFont | ImageFont.ImageFont
    heavy: ImageFont.FreeTypeFont | ImageFont.ImageFont


@dataclass
class WrappedSectionLine:
    bullet: str
    lines: list[str]


@dataclass
class RenderSectionCard:
    title: str
    items: list[WrappedSectionLine]
    height: int


def hex_to_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    red, green, blue = ImageColor.getrgb(value)
    return red, green, blue, alpha


def get_font_paths() -> tuple[Path | None, Path | None]:
    for regular_path, bold_path in FONT_CANDIDATES:
        if regular_path.exists():
            return regular_path, bold_path if bold_path.exists() else regular_path
    return None, None


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    regular_path, bold_path = get_font_paths()
    font_path = bold_path if bold and bold_path else regular_path
    if font_path:
        return ImageFont.truetype(str(font_path), size=size)
    return ImageFont.load_default()


def build_fonts() -> FontPack:
    return FontPack(
        regular=load_font(16),
        medium=load_font(24),
        semibold=load_font(20, bold=True),
        bold=load_font(28, bold=True),
        heavy=load_font(44, bold=True),
    )


def measure_text(font: ImageFont.FreeTypeFont | ImageFont.ImageFont, text: str) -> float:
    if hasattr(font, "getlength"):
        return float(font.getlength(text))
    return float(font.getbbox(text)[2])


def wrap_text(font: ImageFont.FreeTypeFont | ImageFont.ImageFont, text: str, max_width: int) -> list[str]:
    source = text.strip()
    if not source:
        return []

    words = source.split()
    lines: list[str] = []
    current_line = ""

    def push_broken_word(word: str) -> None:
        nonlocal current_line
        fragment = ""
        for character in word:
            candidate = f"{fragment}{character}" if fragment else character
            if measure_text(font, candidate) > max_width and fragment:
                lines.append(fragment)
                fragment = character
            else:
                fragment = candidate
        current_line = fragment

    for word in words:
        candidate = f"{current_line} {word}" if current_line else word
        if measure_text(font, candidate) <= max_width:
            current_line = candidate
            continue

        if current_line:
            lines.append(current_line)

        if measure_text(font, word) <= max_width:
            current_line = word
            continue

        push_broken_word(word)

    if current_line:
        lines.append(current_line)

    return lines


def draw_vertical_gradient(image: Image.Image, top_color: str, bottom_color: str, bounds: tuple[int, int, int, int]) -> None:
    left, top, right, bottom = bounds
    height = max(bottom - top, 1)
    start = ImageColor.getrgb(top_color)
    end = ImageColor.getrgb(bottom_color)
    draw = ImageDraw.Draw(image)
    for offset in range(height):
        ratio = offset / max(height - 1, 1)
        color = tuple(int(start[index] + (end[index] - start[index]) * ratio) for index in range(3))
        draw.line((left, top + offset, right, top + offset), fill=color)


def draw_shadowed_rounded_rect(
    image: Image.Image,
    bounds: tuple[int, int, int, int],
    radius: int,
    fill: str | tuple[int, int, int, int],
    *,
    outline: str | None = None,
    shadow_color: tuple[int, int, int, int] = SHADOW_DARK,
    shadow_blur: int = 24,
    shadow_offset_y: int = 10,
) -> None:
    shadow_layer = Image.new("RGBA", image.size, (255, 255, 255, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    left, top, right, bottom = bounds
    shadow_bounds = (left, top + shadow_offset_y, right, bottom + shadow_offset_y)
    shadow_draw.rounded_rectangle(shadow_bounds, radius=radius, fill=shadow_color)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=shadow_blur))
    image.alpha_composite(shadow_layer)

    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(bounds, radius=radius, fill=fill, outline=outline, width=2 if outline else 0)


def prepare_section_card(fonts: FontPack, section) -> RenderSectionCard:
    items = [
        WrappedSectionLine(
            bullet="•",
            lines=wrap_text(fonts.semibold, line, REPORT_CARD_WIDTH - 112),
        )
        for line in section.lines
    ]
    content_height = 0
    for item in items:
        line_count = max(len(item.lines), 1)
        content_height += line_count * 30 + 14

    return RenderSectionCard(
        title=section.title,
        items=items,
        height=44 + 24 + content_height + 28,
    )


def draw_page_background(image: Image.Image) -> None:
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, REPORT_PAGE_WIDTH, REPORT_PAGE_HEIGHT), fill=BACKGROUND_WARM)
    draw_vertical_gradient(image, CARD_ACCENT, BACKGROUND_WARM, (0, 0, REPORT_PAGE_WIDTH, 520))

    glow_layer = Image.new("RGBA", image.size, (255, 255, 255, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_draw.ellipse(
        (REPORT_PAGE_WIDTH - 348, -32, REPORT_PAGE_WIDTH - 32, 284),
        fill=hex_to_rgba(GLOW, 72),
    )
    glow_draw.ellipse((46, 120, 230, 304), fill=hex_to_rgba(GLOW, 72))
    image.alpha_composite(glow_layer)


def draw_text_lines(
    draw: ImageDraw.ImageDraw,
    lines: Iterable[str],
    *,
    x: int,
    start_y: int,
    font,
    fill: str,
    line_height: int,
) -> int:
    current_y = start_y
    for line in lines:
        draw.text((x, current_y), line, font=font, fill=fill)
        current_y += line_height
    return current_y


def draw_hero_card(image: Image.Image, report: ReportCardDto, fonts: FontPack) -> int:
    title_lines = wrap_text(fonts.heavy, report.title, REPORT_CARD_WIDTH - 120)
    summary_lines = wrap_text(fonts.medium, report.summary, REPORT_CARD_WIDTH - 120)
    hero_height = 236 + len(title_lines) * 50 + len(summary_lines) * 30

    hero_layer = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw_vertical_gradient(
        hero_layer,
        CARD_ACCENT,
        WHITE,
        (
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING + REPORT_CARD_WIDTH,
            REPORT_PAGE_PADDING + hero_height,
        ),
    )
    hero_mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(hero_mask).rounded_rectangle(
        (
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING + REPORT_CARD_WIDTH,
            REPORT_PAGE_PADDING + hero_height,
        ),
        radius=40,
        fill=255,
    )
    hero_layer.putalpha(hero_mask)

    draw_shadowed_rounded_rect(
        image,
        (
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING + REPORT_CARD_WIDTH,
            REPORT_PAGE_PADDING + hero_height,
        ),
        40,
        fill=hex_to_rgba(WHITE, 0),
        outline=BORDER,
        shadow_blur=28,
        shadow_offset_y=10,
    )
    image.alpha_composite(hero_layer)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING + REPORT_CARD_WIDTH,
            REPORT_PAGE_PADDING + hero_height,
        ),
        radius=40,
        outline=BORDER,
        width=2,
    )

    draw.text((REPORT_PAGE_PADDING + 34, REPORT_PAGE_PADDING + 22), "AI SALES ACADEMY", font=load_font(15, bold=True), fill=TEXT_MUTED)

    current_y = REPORT_PAGE_PADDING + 70
    current_y = draw_text_lines(
        draw,
        title_lines,
        x=REPORT_PAGE_PADDING + 34,
        start_y=current_y,
        font=fonts.heavy,
        fill=TEXT_PRIMARY,
        line_height=50,
    )
    current_y += 8
    draw_text_lines(
        draw,
        summary_lines,
        x=REPORT_PAGE_PADDING + 34,
        start_y=current_y,
        font=fonts.medium,
        fill=TEXT_SECONDARY,
        line_height=30,
    )

    pill_y = REPORT_PAGE_PADDING + hero_height - 72
    pill_x = REPORT_PAGE_PADDING + 34
    pill_font = load_font(16, bold=True)
    for label in [report.ownerLabel, report.updatedAt]:
        pill_width = int(measure_text(pill_font, label)) + 36
        draw.rounded_rectangle(
            (pill_x, pill_y, pill_x + pill_width, pill_y + 36),
            radius=18,
            fill=WHITE,
            outline=BORDER,
            width=2,
        )
        draw.text((pill_x + 18, pill_y + 9), label, font=pill_font, fill=TEXT_PRIMARY)
        pill_x += pill_width + 12

    draw.text(
        (REPORT_PAGE_PADDING + 34, REPORT_PAGE_PADDING + hero_height - 28),
        "Сформировано автоматически по завершенному диалогу.",
        font=load_font(16),
        fill=TEXT_MUTED,
    )
    return REPORT_PAGE_PADDING + hero_height + REPORT_CARD_GAP


def draw_continuation_header(image: Image.Image, report: ReportCardDto, page_index: int, fonts: FontPack) -> int:
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING,
            REPORT_PAGE_PADDING + REPORT_CARD_WIDTH,
            REPORT_PAGE_PADDING + 94,
        ),
        radius=REPORT_CARD_RADIUS,
        fill=WHITE,
        outline=BORDER,
        width=2,
    )
    draw.text((REPORT_PAGE_PADDING + 28, REPORT_PAGE_PADDING + 14), "ОТЧЕТ ПО ДИАЛОГУ", font=load_font(14, bold=True), fill=TEXT_MUTED)
    title_line = wrap_text(fonts.bold, report.title, REPORT_CARD_WIDTH - 180)[0]
    draw.text((REPORT_PAGE_PADDING + 28, REPORT_PAGE_PADDING + 42), title_line, font=fonts.bold, fill=TEXT_PRIMARY)
    page_label = f"Страница {page_index + 1}"
    page_label_width = measure_text(load_font(15, bold=True), page_label)
    draw.text(
        (REPORT_PAGE_PADDING + REPORT_CARD_WIDTH - page_label_width - 28, REPORT_PAGE_PADDING + 26),
        page_label,
        font=load_font(15, bold=True),
        fill=TEXT_MUTED,
    )
    return REPORT_PAGE_PADDING + 94 + REPORT_CARD_GAP


def draw_section_card(image: Image.Image, card: RenderSectionCard, y: int, fonts: FontPack) -> None:
    draw_shadowed_rounded_rect(
        image,
        (REPORT_PAGE_PADDING, y, REPORT_PAGE_PADDING + REPORT_CARD_WIDTH, y + card.height),
        REPORT_CARD_RADIUS,
        fill=WHITE,
        outline=BORDER,
        shadow_color=SHADOW_SOFT,
        shadow_blur=18,
        shadow_offset_y=8,
    )
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (REPORT_PAGE_PADDING + 24, y + 24, REPORT_PAGE_PADDING + 92, y + 32),
        radius=4,
        fill=ACTION_PRIMARY,
    )
    draw.text((REPORT_PAGE_PADDING + 24, y + 42), card.title, font=fonts.bold, fill=TEXT_PRIMARY)

    current_y = y + 110
    for item in card.items:
        for index, line in enumerate(item.lines):
            prefix = f"{item.bullet} " if index == 0 else ""
            draw.text((REPORT_PAGE_PADDING + 32, current_y), f"{prefix}{line}", font=fonts.semibold, fill=TEXT_SECONDARY)
            current_y += 30
        current_y += 14


def draw_page_footer(image: Image.Image, page_index: int, total_pages: int) -> None:
    draw = ImageDraw.Draw(image)
    baseline_y = REPORT_PAGE_HEIGHT - REPORT_PAGE_PADDING + 6
    draw.line(
        (REPORT_PAGE_PADDING, baseline_y - 28, REPORT_PAGE_WIDTH - REPORT_PAGE_PADDING, baseline_y - 28),
        fill=BORDER,
        width=2,
    )
    footer_font = load_font(16, bold=True)
    draw.text((REPORT_PAGE_PADDING, baseline_y - 16), "Экспортировано из AI Sales Academy.", font=footer_font, fill=TEXT_MUTED)
    page_label = f"{page_index + 1} / {total_pages}"
    page_label_width = measure_text(footer_font, page_label)
    draw.text((REPORT_PAGE_WIDTH - REPORT_PAGE_PADDING - page_label_width, baseline_y - 16), page_label, font=footer_font, fill=TEXT_MUTED)


def build_page_images(report: ReportCardDto) -> list[Image.Image]:
    fonts = build_fonts()
    pages: list[Image.Image] = []

    def create_page() -> Image.Image:
        page = Image.new("RGBA", (REPORT_PAGE_WIDTH, REPORT_PAGE_HEIGHT), hex_to_rgba(BACKGROUND_WARM))
        draw_page_background(page)
        pages.append(page)
        return page

    page = create_page()
    current_y = draw_hero_card(page, report, fonts)

    for section in report.previewSections:
        card = prepare_section_card(fonts, section)
        max_y = REPORT_PAGE_HEIGHT - REPORT_PAGE_PADDING - REPORT_PAGE_FOOTER_HEIGHT
        if current_y + card.height > max_y:
            page = create_page()
            current_y = draw_continuation_header(page, report, len(pages) - 1, fonts)
        draw_section_card(page, card, current_y, fonts)
        current_y += card.height + REPORT_CARD_GAP

    for index, page_image in enumerate(pages):
        draw_page_footer(page_image, index, len(pages))

    return pages


def build_pdf_bytes(report: ReportCardDto) -> bytes:
    page_images = build_page_images(report)
    buffer = BytesIO()
    pdf = pdf_canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4

    for index, page_image in enumerate(page_images):
        if index > 0:
            pdf.showPage()

        png_buffer = BytesIO()
        page_image.convert("RGB").save(png_buffer, format="PNG", optimize=True)
        png_buffer.seek(0)
        pdf.drawImage(ImageReader(png_buffer), 0, 0, width=page_width, height=page_height, preserveAspectRatio=True, mask="auto")

    pdf.save()
    return buffer.getvalue()
