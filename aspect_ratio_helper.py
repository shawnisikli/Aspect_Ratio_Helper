import math
import tkinter as tk
from tkinter import ttk

RATIO_PRESETS = [
    ("Portrait 3:4", (3, 4)),
    ("Landscape 4:3", (4, 3)),
    ("Square 1:1", (1, 1)),
    ("HD 16:9", (16, 9)),
    ("Vertical 9:16", (9, 16)),
    ("Cinematic 21:9", (21, 9)),
]

PIXEL_PRESETS = [
    ("1080 x 1440 (Portrait 3:4)", (1080, 1440)),
    ("1440 x 1080 (Landscape 4:3)", (1440, 1080)),
    ("1200 x 1200 (Square 1:1)", (1200, 1200)),
    ("1920 x 1080 (Full HD)", (1920, 1080)),
    ("2560 x 1440 (QHD)", (2560, 1440)),
    ("1080 x 1920 (Vertical 9:16)", (1080, 1920)),
    ("300 x 400 (Quick card)", (300, 400)),
    ("2048 x 2732 (Hi-res portrait)", (2048, 2732)),
    ("3840 x 1600 (Ultra-wide 21:9)", (3840, 1600)),
]

MIN_SLIDER = 50
MAX_SLIDER = 6000


class AspectRatioHelper(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Aspect Ratio Helper")
        self.geometry("560x560")
        self.resizable(False, False)
        self.configure(bg="#0f172a")

        self._updating = False
        self._build_styles()
        self._init_variables()
        self._build_layout()
        self._set_initial_state()

    def _build_styles(self) -> None:
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass

        style.configure("Main.TFrame", background="#0f172a")
        style.configure("Card.TFrame", background="#1e293b", borderwidth=0, relief="flat")
        style.configure("Card.TLabelframe", background="#1e293b", foreground="#e2e8f0", borderwidth=0, relief="flat")
        style.configure("Card.TLabelframe.Label", background="#1e293b", foreground="#f8fafc", font=("Segoe UI Semibold", 10))
        style.configure("Title.TLabel", background="#0f172a", foreground="#f1f5f9", font=("Segoe UI Semibold", 18))
        style.configure("Body.TLabel", background="#0f172a", foreground="#cbd5f5", font=("Segoe UI", 10))
        style.configure("Value.TLabel", background="#1e293b", foreground="#f8fafc", font=("Segoe UI", 11))
        style.configure("Highlight.TLabel", background="#1e293b", foreground="#38bdf8", font=("Consolas", 11))
        style.configure("Accent.TButton", font=("Segoe UI", 10, "bold"))
        style.configure("TCombobox", padding=6)

    def _init_variables(self) -> None:
        self.ratio_var = tk.StringVar()
        self.pixel_var = tk.StringVar()
        self.width_var = tk.StringVar()
        self.height_var = tk.StringVar()
        self.slider_var = tk.DoubleVar()

        self.current_ratio_var = tk.StringVar(value="Aspect ratio: —")
        self.target_ratio_var = tk.StringVar(value="Selected ratio: —")
        self.slider_label_var = tk.StringVar()

        self.width_var.trace_add("write", self._handle_width_input)
        self.height_var.trace_add("write", self._handle_height_input)

    def _build_layout(self) -> None:
        main = ttk.Frame(self, padding=20, style="Main.TFrame")
        main.pack(fill="both", expand=True)

        ttk.Label(main, text="Aspect Ratio Helper", style="Title.TLabel").pack(anchor="w")
        ttk.Label(
            main,
            text="Pick a preset, drag the slider, or type values. The helper keeps your dimensions aligned and shows the actual ratio.",
            style="Body.TLabel",
            wraplength=500,
        ).pack(anchor="w", pady=(4, 16))

        ratio_frame = ttk.LabelFrame(main, text="Ratio Preset", padding=14, style="Card.TLabelframe")
        ratio_frame.pack(fill="x", pady=(0, 12))

        ttk.Label(ratio_frame, text="Target ratio", style="Value.TLabel").grid(row=0, column=0, sticky="w")
        ratio_box = ttk.Combobox(
            ratio_frame,
            textvariable=self.ratio_var,
            values=[label for label, _ in RATIO_PRESETS],
            state="readonly",
        )
        ratio_box.grid(row=1, column=0, sticky="we", pady=(4, 0))
        ratio_box.bind("<<ComboboxSelected>>", self._on_ratio_change)

        ttk.Label(ratio_frame, textvariable=self.target_ratio_var, style="Highlight.TLabel").grid(row=2, column=0, sticky="w", pady=(8, 0))
        ratio_frame.columnconfigure(0, weight=1)

        pixel_frame = ttk.LabelFrame(main, text="Pixel Presets", padding=14, style="Card.TLabelframe")
        pixel_frame.pack(fill="x", pady=(0, 12))

        ttk.Label(pixel_frame, text="Common dimensions", style="Value.TLabel").grid(row=0, column=0, sticky="w")
        pixel_box = ttk.Combobox(
            pixel_frame,
            textvariable=self.pixel_var,
            values=[label for label, _ in PIXEL_PRESETS],
            state="readonly",
        )
        pixel_box.grid(row=1, column=0, sticky="we", pady=(4, 0))
        pixel_box.bind("<<ComboboxSelected>>", self._on_pixel_preset)
        pixel_frame.columnconfigure(0, weight=1)

        dims_frame = ttk.LabelFrame(main, text="Pixels", padding=18, style="Card.TLabelframe")
        dims_frame.pack(fill="x", pady=(0, 12))

        vcmd = (self.register(self._validate_pixel_input), "%P")

        ttk.Label(dims_frame, text="Width (px)", style="Value.TLabel").grid(row=0, column=0, sticky="w")
        width_entry = ttk.Entry(dims_frame, textvariable=self.width_var, justify="center", width=12, validate="key", validatecommand=vcmd)
        width_entry.grid(row=1, column=0, padx=(0, 16), pady=(0, 8))

        ttk.Label(dims_frame, text="Height (px)", style="Value.TLabel").grid(row=0, column=1, sticky="w")
        height_entry = ttk.Entry(dims_frame, textvariable=self.height_var, justify="center", width=12, validate="key", validatecommand=vcmd)
        height_entry.grid(row=1, column=1, pady=(0, 8))

        swap_btn = ttk.Button(dims_frame, text="Swap W ↔ H", command=self._swap_dimensions, style="Accent.TButton")
        swap_btn.grid(row=1, column=2, padx=(16, 0))

        slider = ttk.Scale(
            dims_frame,
            from_=MIN_SLIDER,
            to=MAX_SLIDER,
            orient="horizontal",
            variable=self.slider_var,
            command=self._on_slider_move,
        )
        slider.grid(row=2, column=0, columnspan=3, sticky="we", pady=(14, 4))
        ttk.Label(dims_frame, textvariable=self.slider_label_var, style="Value.TLabel").grid(row=3, column=0, columnspan=3, sticky="w")
        dims_frame.columnconfigure(0, weight=1)
        dims_frame.columnconfigure(1, weight=1)
        dims_frame.columnconfigure(2, weight=1)

        ttk.Label(main, textvariable=self.current_ratio_var, style="Highlight.TLabel", wraplength=500, justify="left").pack(fill="x", pady=(4, 0))

    def _set_initial_state(self) -> None:
        default_ratio = RATIO_PRESETS[0][0]
        default_pixels = PIXEL_PRESETS[0][1]
        self.ratio_var.set(default_ratio)
        self.pixel_var.set(PIXEL_PRESETS[0][0])
        self._set_dimensions(width=default_pixels[0], height=default_pixels[1], sync_slider=True)
        self._update_target_ratio_label()
        self._refresh_slider_label()

    def _validate_pixel_input(self, proposed: str) -> bool:
        return proposed.isdigit() or proposed == ""

    def _handle_width_input(self, *_: object) -> None:
        if self._updating:
            return
        width = self._safe_int(self.width_var.get())
        if width is None:
            self._refresh_ratio_display()
            return
        self._updating = True
        self.slider_var.set(self._clamp(width))
        self._updating = False
        self._refresh_slider_label()
        self._refresh_ratio_display()

    def _handle_height_input(self, *_: object) -> None:
        if self._updating:
            return
        self._refresh_ratio_display()

    def _on_ratio_change(self, event: tk.Event | None = None) -> None:
        del event
        self._update_target_ratio_label()
        width = self._safe_int(self.width_var.get())
        if width is not None and width > 0:
            ratio = self._get_selected_ratio()
            if ratio:
                height = max(1, round(width * ratio[1] / ratio[0]))
                self._set_dimensions(width=width, height=height, sync_slider=True)

    def _on_pixel_preset(self, event: tk.Event | None = None) -> None:
        del event
        label = self.pixel_var.get()
        for preset_label, (width, height) in PIXEL_PRESETS:
            if preset_label == label:
                self._set_dimensions(width=width, height=height, sync_slider=True)
                self._match_ratio_to_pixels(width, height)
                break

    def _on_slider_move(self, raw_value: str) -> None:
        if self._updating:
            return
        width = int(float(raw_value))
        ratio = self._get_selected_ratio()
        height = self._safe_int(self.height_var.get())
        if ratio:
            height = max(1, round(width * ratio[1] / ratio[0]))
        self._set_dimensions(width=width, height=height, sync_slider=False)

    def _swap_dimensions(self) -> None:
        width = self._safe_int(self.width_var.get())
        height = self._safe_int(self.height_var.get())
        if width is None or height is None:
            return
        self._set_dimensions(width=height, height=width, sync_slider=True)

    def _set_dimensions(self, width: int | None, height: int | None, sync_slider: bool) -> None:
        self._updating = True
        if width is not None:
            self.width_var.set(str(max(0, int(width))))
            if sync_slider:
                self.slider_var.set(self._clamp(width))
        if height is not None:
            self.height_var.set(str(max(0, int(height))))
        self._updating = False
        self._refresh_slider_label()
        self._refresh_ratio_display()

    def _refresh_slider_label(self) -> None:
        value = int(self.slider_var.get())
        self.slider_label_var.set(f"Slider width: {value} px (range {MIN_SLIDER}-{MAX_SLIDER})")

    def _refresh_ratio_display(self) -> None:
        width = self._safe_int(self.width_var.get())
        height = self._safe_int(self.height_var.get())
        if not width or not height:
            self.current_ratio_var.set("Aspect ratio: add width & height pixels to evaluate.")
            return
        divisor = math.gcd(width, height)
        normalized = f"{width // divisor}:{height // divisor}"
        decimal = width / height
        orientation = "Square" if width == height else ("Landscape" if width > height else "Portrait")
        self.current_ratio_var.set(
            f"Current size: {width} × {height}px   •   Ratio {normalized}   •   W/H = {decimal:.3f}   •   {orientation}"
        )

    def _update_target_ratio_label(self) -> None:
        ratio = self._get_selected_ratio()
        label = self.ratio_var.get()
        if ratio:
            decimal = ratio[0] / ratio[1]
            self.target_ratio_var.set(f"Selected ratio: {label}  ({ratio[0]}:{ratio[1]}  |  W/H = {decimal:.3f})")
        else:
            self.target_ratio_var.set("Selected ratio: —")

    def _match_ratio_to_pixels(self, width: int, height: int) -> None:
        divisor = math.gcd(width, height)
        simplified = (width // divisor, height // divisor)
        for label, ratio in RATIO_PRESETS:
            if ratio[0] * simplified[1] == ratio[1] * simplified[0]:
                self.ratio_var.set(label)
                self._update_target_ratio_label()
                return
        self.target_ratio_var.set(f"Selected ratio: Custom ({simplified[0]}:{simplified[1]})")

    def _get_selected_ratio(self) -> tuple[int, int] | None:
        label = self.ratio_var.get()
        for ratio_label, ratio in RATIO_PRESETS:
            if ratio_label == label:
                return ratio
        return None

    def _safe_int(self, value: str) -> int | None:
        value = value.strip()
        if not value:
            return None
        try:
            return int(value)
        except ValueError:
            return None

    def _clamp(self, value: int) -> int:
        return max(MIN_SLIDER, min(MAX_SLIDER, int(value)))


def main() -> None:
    app = AspectRatioHelper()
    app.mainloop()


if __name__ == "__main__":
    main()
