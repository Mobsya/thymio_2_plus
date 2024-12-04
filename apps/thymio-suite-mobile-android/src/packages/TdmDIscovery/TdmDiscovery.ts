import "fast-text-encoding";
import { createClient } from '@mobsya-association/thymio-api';
import Zeroconf, { Service } from 'react-native-zeroconf';

function isIPv4(ip: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

let firstTime = true;

export class TdmDiscovery {
  zeroconf: Zeroconf;

  resolvedServices: Service[] = [];

  constructor() {
    this.zeroconf = new Zeroconf();

    this.zeroconf.on('found', service => {
      console.log('[Found]', JSON.stringify(service, null, 2));
    });

    this.zeroconf.on('resolved', service => {
      console.log('[Resolve]', JSON.stringify(service, null, 2));

      const ipv4 = service.addresses
        .map((address: string) => isIPv4(address))
        .reduce((acc: boolean, current: boolean) => acc || current, false);

      if (!ipv4) {
        this.zeroconf.stop();
        setTimeout(() => {
          // console.log('[RE-SCAN]', service);
          this.zeroconf.scan('mobsya', 'tcp', 'local.');
        }, 1500);
        return;
      }

      this.resolvedServices.push({
        ...service,
        host: isIPv4(service.host) ? service.host : `[${service.host}]`,
        addresses: service.addresses.map((address: string) =>
          isIPv4(address) ? address : `[${address}]`,
        )
      });

      if(this.resolvedServices.length > 0 && firstTime) {
        console.log(`CREATING CLIENT at ${this.resolvedServices[0].host}:${this.resolvedServices[0].txt['ws-port']}`)
        const client = createClient(`ws://${this.resolvedServices[0].host}:${this.resolvedServices[0].txt['ws-port']}`);
        console.log('CLIENT', client)

        client.onNodesChanged = async (nodes) => {
          console.log('ON NODES CHANGED', nodes)
          for(let node of nodes) {
            console.log('API', node.statusAsString);

            await node.lock();

            /*
            //Monitor variable changes
            node.onVariablesChanged = vars => {
              console.log(vars);
            };
            */

            /*
            //Monitor events
            node.onEvents = async events => {
              console.log('events', events);
              let pong = events.get('pong');
              if (pong) {
                const map = new Map();
                map.set('ping', null);
                await node.emitEvents(map);
              }
            };

            await node.group.setEventsDescriptions([
              {name: 'ping', fixed_size: 0},
              {name: 'pong', fixed_size: 1},
            ]);
            */

            await node.sendAsebaProgram(`
              var rgb[3]
              var tmp[3]
              var i = 0

              call math.rand(rgb)
              for i in 0:2 do
                  rgb[i] = abs rgb[i]
                  rgb[i] = rgb[i] % 20
              end
              call leds.top(rgb[0], rgb[1], rgb[2])
              i++
           `, false);

            await node.runProgram();
          }
        };

        client.onClose = event => {
          console.log('CLOSED', event)
        };

        firstTime = false;
      }
    });

    this.zeroconf.on('start', () => {
      console.log('[Start Scan]');
    });

    this.zeroconf.on('stop', () => {
      console.log('[Stop Scan]');
    });

    this.zeroconf.on('error', (err: any) => {
      console.log('[Error during Scan]');
    });
  }

  close = () => {
    this.zeroconf.stop();
  };

  scan = (): Promise<Service[]> => {
    console.log('[ZEROCONF SCAN]');

    this.resolvedServices = [];

    this.zeroconf.removeDeviceListeners();
    this.zeroconf.stop();
    this.zeroconf.addDeviceListeners();

    this.zeroconf.scan('mobsya', 'tcp', 'local.');

    return new Promise((resolve) => {
      setTimeout(resolve, 1500, this.resolvedServices);
    });
  };
}
