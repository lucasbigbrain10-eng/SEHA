import os
import subprocess
import time
from pathlib import Path
from pypdf import PdfWriter

OUTPUT_DIR = str(Path(__file__).resolve().parent / "telas_pdf")
os.makedirs(OUTPUT_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

PAGES = [
    ("01_Tela_Inicial_Landing.pdf", "http://localhost:3000/"),
    ("02_Cadastro.pdf", "http://localhost:3000/cadastro"),
    ("03_Login.pdf", "http://localhost:3000/login"),
    ("04_Dashboard_Meus_Habitos.pdf", "http://localhost:3000/dashboard"),
    ("05_Criar_Novo_Habito.pdf", "http://localhost:3000/habitos/novo"),
    ("06_Contextualizacao_com_IA.pdf", "http://localhost:3000/habitos/novo/contexto"),
    ("07_Area_do_Habito_Estrategia.pdf", "http://localhost:3000/habitos/habito-1"),
]

generated_files = []

for filename, url in PAGES:
    output_pdf = os.path.join(OUTPUT_DIR, filename)
    print(f"Gerando PDF para {url} -> {filename}...")
    
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={output_pdf}",
        "--window-size=1600,1000",
        "--virtual-time-budget=3000",
        url
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(output_pdf) and os.path.getsize(output_pdf) > 0:
        print(f"  [OK] Gerado: {output_pdf} ({os.path.getsize(output_pdf)} bytes)")
        generated_files.append(output_pdf)
    else:
        print(f"  [ERRO] Falha ao gerar {output_pdf}: {res.stderr}")

# Mesclar todos os PDFs em um único arquivo consolidado com PdfWriter
if generated_files:
    consolidated_pdf = os.path.join(OUTPUT_DIR, "Todas_as_Telas_SEHA.pdf")
    writer = PdfWriter()
    for pdf in generated_files:
        writer.append(pdf)
    with open(consolidated_pdf, "wb") as f_out:
        writer.write(f_out)
    writer.close()
    print(f"\n[SUCESSO] Arquivo consolidado gerado: {consolidated_pdf} ({os.path.getsize(consolidated_pdf)} bytes)")
