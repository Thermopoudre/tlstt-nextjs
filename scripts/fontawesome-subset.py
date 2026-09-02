#!/usr/bin/env python3
"""
Régénère le sous-ensemble Font Awesome utilisé par le site.

Usage : python3 scripts/fontawesome-subset.py
Prérequis : npm install (fournit @fortawesome/fontawesome-free) et `pip install fonttools brotli`.

Produit :
  public/fonts/fa-*-subset.woff2   (polices ne contenant que les glyphes utilisés)
  src/app/fontawesome-subset.css   (règles .fa-nom::before correspondantes)

À relancer après avoir ajouté une icône qui n'existait pas encore dans le code.
"""
import json, subprocess, pathlib, re
racine = pathlib.Path(__file__).resolve().parent.parent
fam = json.load(open(racine / "node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json"))
idx = {}
for name, info in fam.items():
    styles = [s["style"] for s in info.get("familyStylesByLicense", {}).get("free", [])]
    idx[name] = (info["unicode"], styles)
    for a in info.get("aliases", {}).get("names", []):
        idx.setdefault(a, (info["unicode"], styles))
src = subprocess.run(f"grep -rhoE 'fa-[a-z0-9-]+' {racine/'src'}", shell=True, capture_output=True, text=True).stdout.split()
modif = {"fa-spin","fa-fw","fa-lg","fa-xs","fa-sm","fa-2x","fa-3x","fa-xl","fa-2xl","fa-pulse","fa-beat","fa-fade","fa-bounce","fa-shake","fa-flip","fa-solid","fa-regular","fa-brands","fa-stack","fa-inverse"}
noms = {s[3:] for s in src if s not in modif and not s.startswith("fa-rotate") and s[3:] in idx}
noms |= {"chevron-up","chevron-down","chevron-left","chevron-right"}  # utilisées via un gabarit `fa-chevron-${dir}`
solid, regular, brands, regles = set(), set(), set(), []
for n in sorted(noms):
    uni, styles = idx[n]
    regles.append(f'.fa-{n}::before{{content:"\\{uni}"}}')
    if "brands" in styles: brands.add(uni)
    if "solid" in styles: solid.add(uni)
    if "regular" in styles: regular.add(uni)
def subset(srcf, dst, unis):
    subprocess.run(["pyftsubset", str(srcf), f"--unicodes={','.join('U+'+u for u in sorted(unis))}", "--flavor=woff2", f"--output-file={dst}", "--no-hinting", "--desubroutinize"], check=True)
base = racine / "node_modules/@fortawesome/fontawesome-free/webfonts"
(racine / "public/fonts").mkdir(parents=True, exist_ok=True)
subset(base/"fa-solid-900.ttf", racine/"public/fonts/fa-solid-subset.woff2", solid)
subset(base/"fa-regular-400.ttf", racine/"public/fonts/fa-regular-subset.woff2", regular)
subset(base/"fa-brands-400.ttf", racine/"public/fonts/fa-brands-subset.woff2", brands)
entete = f"""/* Font Awesome 6.5.1 Free — sous-ensemble auto-hébergé (généré par scripts/fontawesome-subset.py, ne pas éditer).
   {len(noms)} icônes réellement utilisées au lieu des ~2 000 du pack complet. Classes inchangées : fas / far / fab + fa-nom. */
@font-face{{font-family:"FA Solid";font-style:normal;font-weight:900;font-display:block;src:url("/fonts/fa-solid-subset.woff2") format("woff2")}}
@font-face{{font-family:"FA Regular";font-style:normal;font-weight:400;font-display:block;src:url("/fonts/fa-regular-subset.woff2") format("woff2")}}
@font-face{{font-family:"FA Brands";font-style:normal;font-weight:400;font-display:block;src:url("/fonts/fa-brands-subset.woff2") format("woff2")}}
.fa,.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands{{display:var(--fa-display,inline-block);-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-style:normal;font-variant:normal;line-height:1;text-rendering:auto}}
.fa,.fas,.fa-solid{{font-family:"FA Solid";font-weight:900}}
.far,.fa-regular{{font-family:"FA Regular";font-weight:400}}
.fab,.fa-brands{{font-family:"FA Brands";font-weight:400}}
.fa-fw{{text-align:center;width:1.25em}}
.fa-xs{{font-size:.75em}}.fa-sm{{font-size:.875em}}.fa-lg{{font-size:1.25em;line-height:.05em;vertical-align:-.075em}}.fa-xl{{font-size:1.5em;line-height:.04em;vertical-align:-.125em}}.fa-2xl{{font-size:2em;line-height:.03em;vertical-align:-.1875em}}.fa-2x{{font-size:2em}}.fa-3x{{font-size:3em}}
.fa-spin{{animation:fa-spin 2s infinite linear}}.fa-pulse{{animation:fa-spin 1s infinite steps(8)}}
@keyframes fa-spin{{0%{{transform:rotate(0deg)}}to{{transform:rotate(360deg)}}}}
@media (prefers-reduced-motion:reduce){{.fa-spin,.fa-pulse{{animation-duration:1ms;animation-iteration-count:1}}}}
"""
(racine / "src/app/fontawesome-subset.css").write_text(entete + "\n".join(regles) + "\n", encoding="utf-8")
print(f"OK — {len(noms)} icônes, solid {len(solid)} / regular {len(regular)} / brands {len(brands)} glyphes")
