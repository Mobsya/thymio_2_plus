import "fast-text-encoding";
import { createClient, IClient, INode } from '@mobsya-association/thymio-api';
import Zeroconf, { Service } from 'react-native-zeroconf';
import { BehaviorSubject, finalize, map, Subscription, tap } from 'rxjs';
import { CloseEvent } from "isomorphic-ws";
import { NodeStatus } from "@mobsya-association/thymio-api/dist/thymio_generated/mobsya/fb";

export type ConnectedRobot = {
  host: string,
  port: string,
  node: INode
};

function isIPv4(ip: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

export class RobotService {
  zeroconf: Zeroconf;


  private resolvedServices = new BehaviorSubject<Service[]>([]);
  private openConnections: IClient[] = [];
  private connectionSub?: Subscription;
  private connectedRobots = new BehaviorSubject<ConnectedRobot[]>([]);

  public connectedRobots$ = this.connectedRobots.asObservable();

  constructor() {
    this.zeroconf = new Zeroconf();
    this.connectionSub = undefined;

    this.zeroconf.on('found', service => {
      //console.log('[Found]', JSON.stringify(service, null, 2));
    });

    this.zeroconf.on('resolved', service => {
      //console.log('[Resolve]', JSON.stringify(service, null, 2));

      const resolvedService = {
        ...service,
        host: isIPv4(service.host) ? service.host : `[${service.host}]`,
        addresses: service.addresses.map((address: string) =>
          isIPv4(address) ? address : `[${address}]`,
        )
      };

      const alreadyResolvedHosts = this.resolvedServices.getValue().map(s => s.host);
      console.log('resolved hosts : ', alreadyResolvedHosts)

      if (!alreadyResolvedHosts.find(host => host === resolvedService.host)) {
        console.log('adding : ', resolvedService.host)
        this.resolvedServices.next([resolvedService, ...this.resolvedServices.getValue()]);
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

  private onClose = (event: CloseEvent) => {
    console.log('CLOSED', event);
  }

  private updateConnectedRobots = (updatedRobots: ConnectedRobot[]) => {
    if(updatedRobots.length > 0) {
      let currentRobots = this.connectedRobots.getValue();

      updatedRobots.forEach(updatedRobot => {
        const robotIndex = currentRobots.findIndex(robot => robot.node.id.toString() === updatedRobot.node.id.toString());
        if (robotIndex < 0 && updatedRobot.node.status !== NodeStatus.disconnected) {
          currentRobots.push(updatedRobot);
        } else {
          if (updatedRobot.node.status === NodeStatus.disconnected) {
            currentRobots = currentRobots.filter(robot => robot.node.id.toString() !== updatedRobot.node.id.toString());
          } else {
            currentRobots[robotIndex] = updatedRobot;
          }
        }
      });

      this.connectedRobots.next([...currentRobots]);
    }
  }

  scan = () => {
    console.log('[ZEROCONF SCAN]');

    this.zeroconf.scan('mobsya', 'tcp', 'local.');

    this.connectionSub = this.resolvedServices.pipe(
      map(services => {
        return services.map(service => {
          const host = service.host;
          const port = service.txt['ws-port'];
          console.log(`CREATING CLIENT at ${host}:${port}`)

          const client = createClient(`ws://${host}:${port}`);

          client.onNodesChanged = (nodes) => {
            const connectedRobots: ConnectedRobot[] = nodes
              .map(node => {
                return {
                  host,
                  port,
                  node
                };
              });

            this.updateConnectedRobots(connectedRobots);
          };

          client.onClose = this.onClose;

          return client;
        });
      }),
      tap(clients => this.openConnections = clients),
      finalize(() => this.openConnections.forEach(client => client.close()))
    ).subscribe({
      next: client => client,
    });
  };

  close = () => {
    this.zeroconf.stop();
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
    this.connectedRobots.next([]);
  };
}