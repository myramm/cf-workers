export default function handler(req, res) {
  const {
    uuid = "91ade0d4-a4c8-4dde-b2b3-1365853b70ce",
    host = "vpn.duar.eu.cc",
    format = "all"
  } = req.query;

  const servers = [
    // Indonesia
    { name: "🇮🇩 Telkom Indonesia (Jakarta)", path: "/103.84.207.2-443", ip: "104.18.2.1" },
    { name: "🇮🇩 Biznet Data Center (Jakarta)", path: "/103.186.0.4-443", ip: "104.16.0.1" },
    { name: "🇮🇩 IDCloudHost Jakarta", path: "/103.175.216.14-443", ip: "172.67.73.1" },
    { name: "🇮🇩 Cyber Data Center IDC", path: "/103.147.154.2-443", ip: "104.21.2.1" },
    { name: "🇮🇩 Indosat Ooredoo / Matrix", path: "/id.proxyip.fxxk.dedyn.io-443", ip: "104.22.4.1" },

    // Singapore
    { name: "🇸🇬 Cloudflare Fast Anycast SG", path: "/?ed=2048", ip: "104.18.2.1" },
    { name: "🇸🇬 DigitalOcean Singapore", path: "/sg.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇸🇬 AWS Singapore", path: "/sg1.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇸🇬 Linode / Akamai SG", path: "/sg2.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇸🇬 OVHcloud Singapore", path: "/sg3.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },

    // France
    { name: "🇫🇷 AEZA Group LLC", path: "/109.120.134.91-2053", ip: "104.17.3.81" },
    { name: "🇫🇷 OVHcloud France", path: "/fr.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },
    { name: "🇫🇷 Scaleway Paris", path: "/fr1.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },
    { name: "🇫🇷 Online S.A.S Paris", path: "/fr2.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },
    { name: "🇫🇷 PulseHeberg France", path: "/fr3.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },

    // Bulgaria
    { name: "🇧🇬 Belcloud LTD", path: "/185.148.146.9-443", ip: "104.17.3.81" },
    { name: "🇧🇬 Telepoint Datacenter", path: "/bg.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },
    { name: "🇧🇬 Neterra Cloud Bulgaria", path: "/bg1.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },
    { name: "🇧🇬 Delta.BG Sofia", path: "/bg2.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },
    { name: "🇧🇬 CooliceHost Bulgaria", path: "/bg3.proxyip.fxxk.dedyn.io-443", ip: "104.17.3.81" },

    // USA
    { name: "🇺🇸 Cloudflare US Anycast", path: "/us.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇺🇸 Hurricane Electric San Jose", path: "/us1.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇺🇸 DigitalOcean New York", path: "/us2.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇺🇸 Oracle Cloud Ashburn", path: "/us3.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇺🇸 Google Cloud Los Angeles", path: "/us4.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },

    // Japan
    { name: "🇯🇵 Tokyo Datacenter", path: "/jp.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇯🇵 Sakura Internet Osaka", path: "/jp1.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇯🇵 Linode Tokyo", path: "/jp2.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇯🇵 Oracle Cloud Tokyo", path: "/jp3.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇯🇵 AWS Japan Tokyo", path: "/jp4.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },

    // Germany
    { name: "🇩🇪 Hetzner Online Frankfurt", path: "/de.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇩🇪 Contabo Munich", path: "/de1.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇩🇪 Netcup Germany", path: "/de4.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" }
  ];

  const configList = [];

  servers.forEach(srv => {
    const fmt = format.toLowerCase();
    
    // VLESS Link
    if (fmt === "all" || fmt === "vless") {
      configList.push(`vless://${uuid}@${srv.ip}:443?path=${encodeURIComponent(srv.path)}&security=tls&encryption=none&host=${host}&type=ws&sni=${host}#${encodeURIComponent(srv.name + " [VLESS]")}`);
    }

    // VMess Link (Base64 JSON)
    if (fmt === "all" || fmt === "vmess") {
      const vmessObj = {
        v: "2",
        ps: `${srv.name} [VMess]`,
        add: srv.ip,
        port: "443",
        id: uuid,
        aid: "0",
        scy: "auto",
        net: "ws",
        type: "none",
        host: host,
        path: srv.path,
        tls: "tls",
        sni: host,
        alpn: ""
      };
      configList.push(`vmess://${Buffer.from(JSON.stringify(vmessObj)).toString("base64")}`);
    }

    // Trojan Link
    if (fmt === "all" || fmt === "trojan") {
      configList.push(`trojan://${uuid}@${srv.ip}:443?path=${encodeURIComponent(srv.path)}&security=tls&host=${host}&type=ws&sni=${host}#${encodeURIComponent(srv.name + " [Trojan]")}`);
    }
  });

  const base64Content = Buffer.from(configList.join("\n")).toString("base64");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Profile-Update-Interval", "24");
  res.setHeader("Subscription-Userinfo", "upload=0; download=0; total=1073741824000; expire=0");
  res.status(200).send(base64Content);
}
