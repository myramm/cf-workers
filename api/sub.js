export default function handler(req, res) {
  const {
    uuid = "91ade0d4-a4c8-4dde-b2b3-1365853b70ce",
    host = "vpn.duar.eu.cc"
  } = req.query;

  const servers = [
    { name: "🇫🇷 France (AEZA Group)", path: "/109.120.134.91-2053" },
    { name: "🇧🇬 Bulgaria (Belcloud LTD)", path: "/185.148.146.9-443" },
    { name: "🇸🇬 Singapore (Fast Anycast)", path: "/?ed=2048" },
    { name: "🇺🇸 United States", path: "/us.proxyip.fxxk.dedyn.io-443" },
    { name: "🇩🇪 Germany", path: "/de.proxyip.fxxk.dedyn.io-443" },
    { name: "🇯🇵 Japan", path: "/jp.proxyip.fxxk.dedyn.io-443" },
    { name: "🇬🇧 United Kingdom", path: "/uk.proxyip.fxxk.dedyn.io-443" }
  ];

  const cleanIp = "104.18.2.1";

  const configs = servers.map(srv => {
    return `vless://${uuid}@${cleanIp}:443?path=${encodeURIComponent(srv.path)}&security=tls&encryption=none&host=${host}&type=ws&sni=${host}#${encodeURIComponent(srv.name)}`;
  }).join("\n");

  const base64Content = Buffer.from(configs).toString("base64");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Profile-Update-Interval", "24");
  res.status(200).send(base64Content);
}
