import { Sid } from '..';

function matchesThymioPattern(str: string): boolean {
  const pattern = /Thymio-[a-zA-Z0-9]+\.lan/;
  return !pattern.test(str);
}

export async function getDevices({ sid }: { sid: Sid }): Promise<Array<any>> {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('Cookie', `sysauth_http=${sid}; sysauth=c294af01916d189dfb279f0f0353bff0`);

  var rawIP = JSON.stringify({
    method: 'net.ipv4_hints',
  });

  const responseIP = await fetch('/cgi-bin/luci/rpc/sys', {
    method: 'POST',
    headers: myHeaders,
    body: rawIP,
    redirect: 'follow',
  });

  if (responseIP.status !== 200) {
    throw new Error('Error fetching devices');
  }

  const resultIP = await responseIP.json();

  const devices: Array<any> = await resultIP?.result?.map((device: [string, string]) => ({
    ip: device[0],
    id: device[1],
  }));

  if (!devices) {
    throw new Error('Error fetching devices');
  }

  var rawMac = JSON.stringify({
    method: 'net.mac_hints',
  });

  const responseMac = await fetch('/cgi-bin/luci/rpc/sys', {
    method: 'POST',
    headers: myHeaders,
    body: rawMac,
    redirect: 'follow',
  });

  const resultMac = await responseMac.json();

  const macs = await resultMac?.result?.map((device: [string, string]) => ({
    mac: device[0],
    id: device[1],
  }));

  devices.forEach((device: { ip: string; id: string; mac: string; active: boolean }) => {
    const deviceByMac = macs?.find((mac: { mac: string; id: string }) => mac.id === device.id);
    if (device && deviceByMac) {
      device.mac = deviceByMac.mac;
      device.active = true;
    }
  });

  return devices.filter((device: { active: boolean; id: string }) => device.active && matchesThymioPattern(device.id));
}
