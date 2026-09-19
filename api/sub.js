export default function handler(req, res) {
  const {
    uuid = "91ade0d4-a4c8-4dde-b2b3-1365853b70ce",
    host = "vpn.duar.eu.cc"
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
    { name: "🇩🇪 OVHcloud Germany", path: "/de2.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇩🇪 DigitalOcean Frankfurt", path: "/de3.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇩🇪 Netcup Germany", path: "/de4.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },

    // UK
    { name: "🇬🇧 London Datacenter", path: "/uk.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇬🇧 OVHcloud London", path: "/uk1.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇬🇧 DigitalOcean London", path: "/uk2.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇬🇧 Linode London", path: "/uk3.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇬🇧 AWS London", path: "/uk4.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },

    // Netherlands
    { name: "🇳🇱 Serverius Netherlands", path: "/nl.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇳🇱 WorldStream Amsterdam", path: "/nl1.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇳🇱 DigitalOcean Amsterdam", path: "/nl2.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇳🇱 Leaseweb Netherlands", path: "/nl3.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇳🇱 Hetzner Netherlands", path: "/nl4.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },

    // Hong Kong
    { name: "🇭🇰 HKIX Hong Kong", path: "/hk.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇭🇰 Alibaba Cloud Hong Kong", path: "/hk1.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇭🇰 Tencent Cloud Hong Kong", path: "/hk2.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇭🇰 UCloud Hong Kong", path: "/hk3.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" },
    { name: "🇭🇰 HKT / PCCW Hong Kong", path: "/hk4.proxyip.fxxk.dedyn.io-443", ip: "104.18.2.1" }
  ];

  const configs = servers.map(srv => {
    return `vless://${uuid}@${srv.ip}:443?path=${encodeURIComponent(srv.path)}&security=tls&encryption=none&host=${host}&type=ws&sni=${host}#${encodeURIComponent(srv.name)}`;
  }).join("\n");

  const base64Content = Buffer.from(configs).toString("base64");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Profile-Update-Interval", "24");
  res.status(200).send(base64Content);
}
