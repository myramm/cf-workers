# 🚀 Cloudflare VLESS Tunnel & Multi-Server Web Generator

Sistem VPN Serverless VLESS bertenaga **Cloudflare Workers** & Web Generator Panel yang di-deploy di **Vercel**.

Author / Developer: **Rama Tukang code**

## 🌐 Live URLs
- **Web Generator Panel:** [https://cf.duar.eu.cc](https://cf.duar.eu.cc)
- **VLESS Server Endpoint:** `vpn.duar.eu.cc` (Port: 443 / TLS / WebSocket)
- **Main Domain:** [http://duar.eu.cc](http://duar.eu.cc)

---

## ✨ Fitur-Fitur
1. **Multi-Negara / Multi-Server Outbound:**
   - 🇫🇷 Prancis (AEZA GROUP LLC - `109.120.134.91:2053`)
   - 🇧🇬 Bulgaria (Belcloud LTD - `185.148.146.9:443`)
   - 🇸🇬 Singapura (Cloudflare Fast Anycast)
   - 🇺🇸 Amerika Serikat
   - 🇯🇵 Jepang
   - 🇩🇪 Jerman
   - 🇬🇧 Inggris
   - 🛠️ Custom Proxy IP & Port
2. **Preset Clean IP ISP Indonesia:**
   - Telkomsel / By.U (`104.18.2.1` / `104.17.3.81`)
   - Indihome / Telkom (`172.67.73.1`)
   - XL / Axis (`104.21.2.1`)
   - Tri / Smartfren (`162.159.138.1`)
   - Biznet / FirstMedia (`104.16.85.1`)
3. **Auto QR Code Generator** (Scan langsung dari v2rayNG / NekoBox).
4. **Subscription Link API** (`/api/sub?host=vpn.duar.eu.cc&uuid=...`).
5. **Export Format:** VLESS URL, Clash Meta (YAML), Sing-box (JSON).

---

## 📁 Struktur Folder
- `public/index.html` : Frontend Web Generator (Tailwind CSS, Glassmorphism Dark UI, QRCode.js).
- `api/sub.js` : Serverless function Vercel untuk Subscription auto-update format Base64.
- `cf-worker/` : Script Cloudflare Worker (`src/index.js`, `wrangler.toml`).
- `vercel.json` : Konfigurasi Vercel deployment.

---

## 👨‍💻 Created by
**Rama Tukang code**
