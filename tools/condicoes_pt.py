"""Tradução das condições do ClinicalTrials.gov (em inglês) para o texto das fichas automáticas.

Uso: python tools/condicoes_pt.py  -> reescreve o texto já existente em dados/data.js e dados/data-detalhes.js.
Termos fora do dicionário ficam em inglês.
"""
import re
import sys

PT = {
    "Age-Related Macular Degeneration": "Degeneração macular relacionada à idade",
    "Aging": "Envelhecimento", "Asthma": "Asma", "Athletic Performance": "Desempenho atlético",
    "Autoimmune Diseases": "Doenças autoimunes", "Autoimmune Thyroiditis": "Tireoidite autoimune",
    "Thyroiditis Autoimmune": "Tireoidite autoimune",
    "Bariatric Surgery Candidate": "Candidatos a cirurgia bariátrica", "Bipolar Disorder": "Transtorno bipolar",
    "Blood Pressure": "Pressão arterial", "Body Weight": "Peso corporal", "Breast Cancer": "Câncer de mama",
    "Cancer": "Câncer", "Cardiovascular Disease": "Doença cardiovascular", "Cardiovascular Diseases": "Doença cardiovascular",
    "Cholesterol": "Colesterol", "Chronic Cough": "Tosse crônica",
    "Chronic Obstructive Pulmonary Disease": "Doença pulmonar obstrutiva crônica (DPOC)",
    "Chronic Pain": "Dor crônica", "Chronic Venous Disease": "Doença venosa crônica",
    "Chronic Venous Insufficiency": "Insuficiência venosa crônica", "Cognitive Change": "Mudanças cognitivas",
    "Cognitive Decline": "Declínio cognitivo", "Covid19": "COVID-19",
    "Diabetes Mellitus - Type 1": "Diabetes tipo 1", "Type 1 Diabetes": "Diabetes tipo 1",
    "Diabetes Mellitus - Type 2": "Diabetes tipo 2", "Type 2 Diabetes": "Diabetes tipo 2",
    "Type 2 Diabetes Mellitus": "Diabetes tipo 2", "Type2 Diabetes": "Diabetes tipo 2",
    "Diabetic Ulcers": "Úlceras diabéticas",
    "Effect of Selenium on Oxidative Stress in Healthy Men": "Efeito do selênio no estresse oxidativo em homens saudáveis",
    "Eicosapentaenoic Acid": "Ácido eicosapentaenoico (EPA)", "Erythrocyte Glutathione Deficiency": "Deficiência de glutationa nos eritrócitos",
    "Exercise": "Exercício", "G6PD Deficiency": "Deficiência de G6PD", "Gastroesophageal Reflux": "Refluxo gastroesofágico",
    "Gestational Diabetes Mellitus": "Diabetes gestacional", "HIV Infection": "Infecção por HIV",
    "Haemorrhoids": "Hemorroidas", "Healthy": "Voluntários saudáveis", "Healthy Diet": "Dieta saudável",
    "Hypercholesterolemia": "Hipercolesterolemia", "Hypertension": "Hipertensão", "Inflammation": "Inflamação",
    "Insulin Resistance": "Resistência à insulina", "Kidney Stone": "Cálculo renal", "Lipedema": "Lipedema",
    "Liver Disease": "Doença hepática", "Lung Cancer": "Câncer de pulmão", "Magnesium Deficiency": "Deficiência de magnésio",
    "Malaria": "Malária", "Malnutrition": "Desnutrição", "Memory Loss": "Perda de memória", "Menopause": "Menopausa",
    "Mental Processes": "Processos mentais", "Metabolic Disturbance": "Distúrbio metabólico",
    "Metabolic Syndrome": "Síndrome metabólica", "Mild Cognitive Impairment": "Comprometimento cognitivo leve",
    "Mineral Deficiency": "Deficiência de minerais", "Non Alcoholic Steatohepatitis": "Esteato-hepatite não alcoólica",
    "Non-Alcoholic Fatty Liver Disease": "Doença hepática gordurosa não alcoólica",
    "Non-proliferative Diabetic Retinopathy": "Retinopatia diabética não proliferativa", "Obesity": "Obesidade",
    "Omega-3": "Ômega-3", "Overweight": "Sobrepeso", "Oxidative Stress": "Estresse oxidativo",
    "PCOS": "Síndrome dos ovários policísticos", "Polycystic Ovary Syndrome": "Síndrome dos ovários policísticos",
    "Polycystic Ovary Syndrome (PCOS)": "Síndrome dos ovários policísticos", "Parkinson Disease": "Doença de Parkinson",
    "Physiologic Changes": "Mudanças fisiológicas", "Physiological Changes (Heart Rate)": "Mudanças fisiológicas (frequência cardíaca)",
    "Power": "Potência muscular", "Prediabetic State": "Pré-diabetes",
    "Prodromal to Chronic Venous Disease": "Fase inicial da doença venosa crônica", "Prostate Cancer": "Câncer de próstata",
    "Quality of Life": "Qualidade de vida", "Regurgitation": "Regurgitação", "Rhinitis": "Rinite", "Sarcopenia": "Sarcopenia",
    "Skin Abnormalities": "Alterações na pele", "Skin Aging": "Envelhecimento da pele",
    "Sleep Initiation and Maintenance Disorders": "Distúrbios do início e da manutenção do sono", "Sleep Quality": "Qualidade do sono",
    "Triglycerides": "Triglicerídeos", "Uveitis": "Uveíte", "Vitamin A Deficiency": "Deficiência de vitamina A",
    "Vitamin D Deficiency": "Deficiência de vitamina D", "Vitamin Deficiency": "Deficiência de vitaminas",
    "Vomiting": "Vômito", "Wrinkles": "Rugas",
}
PT_MIN = {k.lower(): v for k, v in PT.items()}


def traduzir(termo):
    return PT_MIN.get(termo.strip().lower(), termo)


def traduzir_lista(pares):
    """Traduz e soma os termos que viram o mesmo nome (ex.: 'Obesity' e 'Overweight' continuam separados)."""
    soma = {}
    for nome, n in pares:
        t = traduzir(nome)
        soma[t] = soma.get(t, 0) + n
    return sorted(soma.items(), key=lambda kv: -kv[1])


PADRAO = re.compile(r"(Condições mais estudadas nos ensaios) \(termos do registro, em inglês\): (.*?)\.( (?:Quantidade|Confira))")


def _reescrever(m):
    pares = [(a, int(b)) for a, b in re.findall(r"(.+?) \((\d+)\)(?:, |$)", m.group(2))]
    lista = ", ".join("%s (%d)" % kv for kv in traduzir_lista(pares))
    return "%s: %s.%s" % (m.group(1), lista, m.group(3))


def main():
    for arq in ("dados/data.js", "dados/data-detalhes.js"):
        txt = open(arq, encoding="utf-8").read()
        novo, n = PADRAO.subn(_reescrever, txt)
        open(arq, "w", encoding="utf-8", newline="").write(novo)
        print(arq, n, "textos reescritos")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
