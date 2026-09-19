export default function handler(req, res) {
  const {
    uuid = "91ade0d4-a4c8-4dde-b2b3-1365853b70ce",
    host = "vpn.duar.eu.cc"
  } = req.query;

  const servers = [
    { name: "🇮🇩 ID - Telkom Indonesia (Jakarta)", path: "/103.84.207.2-443", ip: "104.18.2.1" },
    { name: "🇮🇩 ID - Biznet Data Center", path: "/103.186.0.4-443", ip: "104.16.0.1" },
    { name: "🇮🇩 ID - IDCloudHost Jakarta", path: "/103.175.216.14-443", ip: "172.67.73.1" },
    { name: "🇮🇩 ID - Cyber Data Center", path: "/103.147.154.2-443", ip: "104.21.2.1" },
    { name: "🇸🇬 SG - Cloudflare Fast Anycast", path: "/?ed=2048", ip: "104.18.2.1" },
    { name: "🇫🇷 FR - AEZA Group LLC", path: "/109.120.134.91-2053", ip: "104.17.3.81" },
    { name: "🇧🇬 BG - Belcloud LTD", path: "/185.148.146.9-443", ip: "104.17.3.81" },
    { name: "🇺🇸 US - United States Outbound", path: "/us.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇯🇵 JP - Japan Tokyo", path: "/jp.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇩🇪 DE - Germany Frankfurt", path: "/de.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇬🇧 UK - United Kingdom", path: "/uk.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" }
  ];

  const configs = servers.map(srv => {
    return `vless://${uuid}@${srv.ip}:443?path=${encodeURIComponent(srv.path)}&security=tls&encryption=none&host=${host}&type=ws&sni=${host}#${encodeURIComponent(srv.name)}`;
  }).join("\n");

  const base64Content = Buffer.from(configs).toString("base64");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Profile-Update-Interval", "24");
  res.status(200).send(base64Content);
}
