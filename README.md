

# 🏥 Htect — AI Medical Imaging Analysis

> An AI-powered medical imaging analysis platform providing ranked radiological findings in English and Arabic.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ⚠️ Medical Disclaimer
This application is **experimental and for educational/research use only**.
It is NOT a medical device and NOT a substitute for professional medical advice.
Always consult a licensed physician or radiologist.

---

## 🌟 Overview

Htect is a cross-platform medical imaging analysis prototype that leverages Google's Gemini AI to analyze X-ray and MRI images, providing ranked diagnostic suggestions with confidence scores in both English and Arabic.

**Live Demo:** [View on AI Studio](https://ai.studio/apps/028ad404-4973-41c5-bb85-0175156e267f)

---

## 📸 Screenshots

| Disclaimer | Home | Upload |
|-----------|------|--------|
| ![](screenshots/IMG_0228.png) | ![](screenshots/IMG_0229.png) | ![](screenshots/IMG_0230.png) |

| Analyzing | Results | Diagnoses |
|-----------|---------|-----------|
| ![](screenshots/IMG_0231.png) | ![](screenshots/IMG_0232.png) | ![](screenshots/IMG_0233.png) |

| Arabic Support | Medical Terms | Patient Plan |
|---------------|---------------|--------------|
| ![](screenshots/IMG_0234.png) | ![](screenshots/IMG_0235.png) | ![](screenshots/IMG_0236.png) |

---

## ✨ Features

- 🤖 **AI-Powered Analysis** — Gemini AI for medical image interpretation
- 📊 **Ranked Diagnoses** — 3–6 findings with confidence scores
- 🌍 **Bilingual** — Full English & Arabic with RTL layout
- 📱 **Cross-Platform** — iOS, Android & Web
- 🔒 **Privacy First** — Local storage only
- 📷 **Camera & Gallery** — Capture or upload images
- 📜 **Ethics Framework** — Mandatory consent before every analysis
- 🕒 **Analysis History** — Local history with thumbnails
- 👨‍⚕️ **Physician Liaison** — Generate doctor's notes & patient action plans
- 📖 **Medical Terminology** — Bilingual explanations for every finding
- 🌙 **Dark/Light Mode** — System default

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| AI | Google Gemini AI |
| Standards | HL7, FHIR |
| Storage | localStorage (encrypted) |
| Localization | i18n, RTL support |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/wnbda19/htech-radiology-ai.git

cd htech-radiology-ai
npm install
npm run dev


Environment Variables

GEMINI_API_KEY=your_api_key_here


🔮 Roadmap
	∙	DICOM file support
	∙	MedGemma 1.5 4B via Vertex AI
	∙	PDF report export
	∙	Cloud sync (opt-in)

👨‍💻 Author
Mohammed
Health Informatics Student | AI in Healthcare
LinkedIn • GitHub

Built with ❤️ for the future of healthcare technology


---

