// @ts-nocheck
import { connect } from 'cloudflare:sockets';

// Multi-Protocol Cloudflare Worker Proxy (VLESS & Trojan over WebSocket)
// Author: Rama Tukang code

let userID = '91ade0d4-a4c8-4dde-b2b3-1365853b70ce';
let proxyIP = 'proxyip.fxxk.dedyn.io';

if (!isValidUUID(userID)) {
	throw new Error('uuid is not valid');
}

export default {
	/**
	 * @param {import("@cloudflare/workers-types").Request} request
	 * @param {{UUID: string, PROXYIP: string}} env
	 * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		try {
			userID = env.UUID || userID;
			proxyIP = env.PROXYIP || proxyIP;
			const upgradeHeader = request.headers.get('Upgrade');
			const url = new URL(request.url);

			// Support Custom Proxy IP via URL path: /ip-port or /domain-port
			let customProxyIP = '';
			let customProxyPort = 0;
			const pathMatch = url.pathname.match(/^\/([a-zA-Z0-9.-]+)-(\d+)/);
			if (pathMatch) {
				customProxyIP = pathMatch[1];
				customProxyPort = parseInt(pathMatch[2], 10);
			}

			if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
				switch (url.pathname) {
					case '/health':
					case '/ping':
						return new Response(JSON.stringify({ status: 'active', protocols: ['vless', 'vmess', 'trojan'], author: 'Rama Tukang code' }), {
							status: 200,
							headers: { 'Content-Type': 'application/json' }
						});
					case `/${userID}`:
					case '/config':
						const vlessConfig = getProxyConfig(userID, request.headers.get('Host'));
						return new Response(`${vlessConfig}`, {
							status: 200,
							headers: {
								'Content-Type': 'text/plain;charset=utf-8',
							},
						});
					default:
						return new Response('DUAR Multi-Protocol Tunnel (VLESS & Trojan) Active', { status: 200 });
				}
			} else {
				return await proxyOverWSHandler(request, customProxyIP, customProxyPort);
			}
		} catch (err) {
			/** @type {Error} */ let e = err;
			return new Response(e.toString());
		}
	},
};

/**
 * Handles incoming WebSocket connections for VLESS & Trojan
 * @param {import("@cloudflare/workers-types").Request} request
 */
async function proxyOverWSHandler(request, customProxyIP = '', customProxyPort = 0) {
	const webSocketPair = new WebSocketPair();
	const [client, webSocket] = Object.values(webSocketPair);

	webSocket.accept();

	let address = '';
	let portWithRandomLog = '';
	const log = (info, event) => {
		console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
	};
	const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

	const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

	let remoteSocketWapper = {
		value: null,
	};
	let udpStreamWrite = null;
	let isDns = false;

	readableWebSocketStream.pipeTo(new WritableStream({
		async write(chunk, controller) {
			if (isDns && udpStreamWrite) {
				return udpStreamWrite(chunk);
			}
			if (remoteSocketWapper.value) {
				const writer = remoteSocketWapper.value.writable.getWriter();
				await writer.write(chunk);
				writer.releaseLock();
				return;
			}

			const {
				hasError,
				message,
				portRemote = 443,
				addressRemote = '',
				rawDataIndex,
				vlessVersion = null,
				isUDP,
				isTrojan = false,
			} = processHeader(chunk, userID);

			address = addressRemote;
			portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp ' : 'tcp '}`;
			if (hasError) {
				throw new Error(message);
			}

			if (isUDP) {
				if (portRemote === 53) {
					isDns = true;
				} else {
					throw new Error('UDP proxy only enabled for DNS (port 53)');
				}
			}

			// VLESS requires a response header [version, 0]. Trojan does not.
			const responseHeader = isTrojan || !vlessVersion ? null : new Uint8Array([vlessVersion[0], 0]);
			const rawClientData = chunk.slice(rawDataIndex);

			if (isDns) {
				const { write } = await handleUDPOutBound(webSocket, responseHeader, log);
				udpStreamWrite = write;
				udpStreamWrite(rawClientData);
				return;
			}
			handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, responseHeader, log, customProxyIP, customProxyPort);
		},
		close() {
			log(`readableWebSocketStream is close`);
		},
		abort(reason) {
			log(`readableWebSocketStream is abort`, JSON.stringify(reason));
		},
	})).catch((err) => {
		log('readableWebSocketStream pipeTo error', err);
	});

	return new Response(null, {
		status: 101,
		webSocket: client,
	});
}

/**
 * Detects protocol (VLESS or Trojan) and parses connection parameters
 */
function processHeader(chunk, userID) {
	if (chunk.byteLength < 18) {
		return { hasError: true, message: 'Invalid data length' };
	}
	const firstByte = new Uint8Array(chunk.slice(0, 1))[0];
	if (firstByte === 0) {
		return processVlessHeader(chunk, userID);
	}
	return processTrojanHeader(chunk, userID);
}

/**
 * Parses VLESS Protocol Header
 */
function processVlessHeader(vlessBuffer, userID) {
	if (vlessBuffer.byteLength < 24) {
		return {
			hasError: true,
			message: 'invalid vless buffer length',
		};
	}
	const version = new Uint8Array(vlessBuffer.slice(0, 1));
	let isValidUser = false;
	let isUDP = false;
	const slicedBuffer = new Uint8Array(vlessBuffer.slice(1, 17));
	const slicedBufferString = stringify(slicedBuffer);

	isValidUser = slicedBufferString === userID;

	const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];
	const command = new Uint8Array(
		vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
	)[0];

	if (command === 1) {
		isUDP = false;
	} else if (command === 2) {
		isUDP = true;
	} else {
		return {
			hasError: true,
			message: `command ${command} is not supported, command 01-tcp,02-udp,03-mux`,
		};
	}
	const portIndex = 18 + optLength + 1;
	const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
	const portRemote = new DataView(portBuffer).getUint16(0);

	let addressIndex = portIndex + 2;
	const addressBuffer = new Uint8Array(
		vlessBuffer.slice(addressIndex, addressIndex + 1)
	);

	const addressType = addressBuffer[0];
	let addressLength = 0;
	let addressValueIndex = addressIndex + 1;
	let addressValue = '';
	switch (addressType) {
		case 1:
			addressLength = 4;
			addressValue = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			).join('.');
			break;
		case 2:
			addressLength = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
			)[0];
			addressValueIndex += 1;
			addressValue = new TextDecoder().decode(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			break;
		case 3:
			addressLength = 16;
			const dataView = new DataView(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			const ipv6 = [];
			for (let i = 0; i < 8; i++) {
				ipv6.push(dataView.getUint16(i * 2).toString(16));
			}
			addressValue = ipv6.join(':');
			break;
		default:
			return {
				hasError: true,
				message: `invalid addressType is ${addressType}`,
			};
	}
	if (!addressValue) {
		return {
			hasError: true,
			message: `addressValue is empty, addressType is ${addressType}`,
		};
	}

	return {
		hasError: false,
		addressRemote: addressValue,
		addressType,
		portRemote,
		rawDataIndex: addressValueIndex + addressLength,
		vlessVersion: version,
		isUDP,
		isTrojan: false,
	};
}

/**
 * Parses Trojan Protocol Header
 */
function processTrojanHeader(trojanBuffer, password) {
	if (trojanBuffer.byteLength < 56 + 2 + 1 + 1 + 2 + 2) {
		return { hasError: true, message: 'Invalid Trojan header length' };
	}
	const dataView = new DataView(trojanBuffer);
	if (dataView.getUint8(56) !== 0x0D || dataView.getUint8(57) !== 0x0A) {
		return { hasError: true, message: 'Invalid Trojan CRLF delimiter' };
	}

	const command = dataView.getUint8(58);
	const isUDP = command === 3;
	const addressType = dataView.getUint8(59);
	let addressLength = 0;
	let addressValueIndex = 60;
	let addressValue = '';

	switch (addressType) {
		case 1: // IPv4
			addressLength = 4;
			addressValue = new Uint8Array(trojanBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join('.');
			break;
		case 3: // Domain
			addressLength = dataView.getUint8(addressValueIndex);
			addressValueIndex += 1;
			addressValue = new TextDecoder().decode(trojanBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
			break;
		case 4: // IPv6
			addressLength = 16;
			const dataViewIPv6 = new DataView(trojanBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
			const ipv6 = [];
			for (let i = 0; i < 8; i++) {
				ipv6.push(dataViewIPv6.getUint16(i * 2).toString(16));
			}
			addressValue = ipv6.join(':');
			break;
		default:
			return { hasError: true, message: `Invalid Trojan addressType: ${addressType}` };
	}

	const portIndex = addressValueIndex + addressLength;
	const portRemote = dataView.getUint16(portIndex);
	// Trojan has 2 bytes CRLF after port
	const rawDataIndex = portIndex + 2 + 2;

	return {
		hasError: false,
		addressRemote: addressValue,
		addressType,
		portRemote,
		rawDataIndex,
		isUDP,
		isTrojan: true,
		vlessVersion: null,
	};
}

/**
 * Handles outbound TCP connections.
 */
async function handleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, responseHeader, log, customProxyIP = '', customProxyPort = 0) {
	async function connectAndWrite(address, port) {
		const tcpSocket = connect({
			hostname: address,
			port: port,
		});
		remoteSocket.value = tcpSocket;
		log(`connected to ${address}:${port}`);
		const writer = tcpSocket.writable.getWriter();
		await writer.write(rawClientData);
		writer.releaseLock();
		return tcpSocket;
	}

	async function retry() {
		const targetProxyIP = customProxyIP || proxyIP;
		const targetProxyPort = customProxyPort || portRemote;
		log(`retrying connect via proxy: ${targetProxyIP}:${targetProxyPort}`);
		const tcpSocket = await connectAndWrite(targetProxyIP, targetProxyPort);
		tcpSocket.closed.catch((error) => {
			console.error('retry tcpSocket closed error', error);
		}).finally(() => {
			safeCloseWebSocket(webSocket);
		});
		remoteSocketToWS(tcpSocket, webSocket, responseHeader, null, log);
	}

	const tcpSocket = await connectAndWrite(addressRemote, portRemote);

	remoteSocketToWS(tcpSocket, webSocket, responseHeader, retry, log);
}

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
	let readableStreamCancel = false;
	const stream = new ReadableStream({
		start(controller) {
			webSocketServer.addEventListener('message', (event) => {
				if (readableStreamCancel) {
					return;
				}
				const message = event.data;
				controller.enqueue(message);
			});

			webSocketServer.addEventListener('close', () => {
				safeCloseWebSocket(webSocketServer);
				if (readableStreamCancel) {
					return;
				}
				controller.close();
			});
			webSocketServer.addEventListener('error', (err) => {
				log('webSocketServer error', err);
				controller.error(err);
			});
			const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
			if (error) {
				controller.error(error);
			} else if (earlyData) {
				controller.enqueue(earlyData);
			}
		},

		pull(controller) {
		},
		cancel(reason) {
			if (readableStreamCancel) {
				return;
			}
			log(`ReadableStream was canceled, due to ${reason}`);
			readableStreamCancel = true;
			safeCloseWebSocket(webSocketServer);
		}
	});

	return stream;
}

async function remoteSocketToWS(remoteSocket, webSocket, responseHeader, retry, log) {
	let respHeader = responseHeader;
	let hasIncomingData = false;
	await remoteSocket.readable
		.pipeTo(
			new WritableStream({
				start() {
				},
				async write(chunk, controller) {
					hasIncomingData = true;
					if (webSocket.readyState !== WS_READY_STATE_OPEN) {
						controller.error('webSocket.readyState is not open');
					}
					if (respHeader) {
						webSocket.send(await new Blob([respHeader, chunk]).arrayBuffer());
						respHeader = null;
					} else {
						webSocket.send(chunk);
					}
				},
				close() {
					log(`remoteConnection readable closed`);
				},
				abort(reason) {
					console.error(`remoteConnection readable abort`, reason);
				},
			})
		)
		.catch((error) => {
			console.error(`remoteSocketToWS exception`, error.stack || error);
			safeCloseWebSocket(webSocket);
		});

	if (hasIncomingData === false && retry) {
		log(`retry outbound`);
		retry();
	}
}

function base64ToArrayBuffer(base64Str) {
	if (!base64Str) {
		return { error: null };
	}
	try {
		base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
		const decode = atob(base64Str);
		const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
		return { earlyData: arryBuffer.buffer, error: null };
	} catch (error) {
		return { error };
	}
}

function isValidUUID(uuid) {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
function safeCloseWebSocket(socket) {
	try {
		if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
			socket.close();
		}
	} catch (error) {
		console.error('safeCloseWebSocket error', error);
	}
}

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
	byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
	return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
	const uuid = unsafeStringify(arr, offset);
	if (!isValidUUID(uuid)) {
		throw TypeError("Stringified UUID is invalid");
	}
	return uuid;
}

async function handleUDPOutBound(webSocket, responseHeader, log) {
	let isHeaderSent = false;
	const transformStream = new TransformStream({
		start(controller) {
		},
		transform(chunk, controller) {
			for (let index = 0; index < chunk.byteLength;) {
				const lengthBuffer = chunk.slice(index, index + 2);
				const udpPakcetLength = new DataView(lengthBuffer).getUint16(0);
				const udpData = new Uint8Array(
					chunk.slice(index + 2, index + 2 + udpPakcetLength)
				);
				index = index + 2 + udpPakcetLength;
				controller.enqueue(udpData);
			}
		},
		flush(controller) {
		}
	});

	transformStream.readable.pipeTo(new WritableStream({
		async write(chunk) {
			const resp = await fetch('https://1.1.1.1/dns-query', {
				method: 'POST',
				headers: {
					'content-type': 'application/dns-message',
				},
				body: chunk,
			});
			const dnsQueryResult = await resp.arrayBuffer();
			const udpSize = dnsQueryResult.byteLength;
			const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);
			if (webSocket.readyState === WS_READY_STATE_OPEN) {
				log(`doh success length ${udpSize}`);
				if (isHeaderSent || !responseHeader) {
					webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
				} else {
					webSocket.send(await new Blob([responseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
					isHeaderSent = true;
				}
			}
		}
	})).catch((error) => {
		log('dns udp error' + error);
	});

	const writer = transformStream.writable.getWriter();
	return {
		write(chunk) {
			writer.write(chunk);
		}
	};
}

function getProxyConfig(userID, hostName) {
	const vlessMain = `vless://${userID}@${hostName}:443?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=%2F%3Fed%3D2048#DUAR-VLESS-TLS`;
	const trojanMain = `trojan://${userID}@${hostName}:443?security=tls&sni=${hostName}&type=ws&host=${hostName}&path=%2F%3Fed%3D2048#DUAR-TROJAN-TLS`;

	return `
================================================================
DUAR MULTI-PROTOCOL TUNNEL (VLESS & TROJAN)
Host: ${hostName}
UUID / Password: ${userID}
Author: Rama Tukang code
================================================================

[ VLESS TLS (Port 443) ]
${vlessMain}

[ TROJAN TLS (Port 443) ]
${trojanMain}
================================================================
`;
}
