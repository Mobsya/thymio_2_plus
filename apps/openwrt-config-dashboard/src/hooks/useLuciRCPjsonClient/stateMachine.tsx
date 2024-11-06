import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useActor } from '@xstate/react';
import { Actions, assign, createMachine, DoneInvokeEvent, interpret, send } from 'xstate';
import { getLoginSid } from './fetchCalls/getLoginToken';
import { getDevices } from './fetchCalls/getAllDevicesIP_Name';
import { getWifiStatus } from './fetchCalls/getWifiStatus';
import { getInternetStatus } from './fetchCalls/getInternetStatus';
import { ContextData, Event, ServiceEvent, initialState } from '.';
import { createClient, IGroup, INode, Variables } from '@mobsya-association/thymio-api';
import { getWifiConfigFile } from './fetchCalls/getWifiConfigFile';
import { getUptime } from './fetchCalls/getUptime';
import { getIfStatus } from './fetchCalls/getIfstatus';
import CryptoJS from 'crypto-js';

function encryptText(plainText: string, secretKey: string): string {
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

function decryptText(cipherText: string, secretKey: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

const actions = {
  getSessionData: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      localStorage.removeItem('section');
      const sid = sessionStorage.getItem('sid');
      const firstUse = await getLoginSid({ password: 'thymiobymobsya' });

      if (firstUse && firstUse.includes('ERROR')) {
        reject({ error: true });
      }

      const valur = !!firstUse;

      if (!sid || valur) {
        reject({ sid, firstUse: valur });
      }

      resolve({ sid, firstUse: valur });
    });
  },
  login: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      const password = event.data.password;

      const newSid = await getLoginSid({ password: password });

      if (newSid && newSid.includes('ERROR')) {
        reject({ error: true });
      }

      if (!newSid) {
        sessionStorage.removeItem('sid');
        reject();
      }

      const eps = encryptText(password, newSid);

      sessionStorage.setItem('sid', newSid);
      sessionStorage.setItem('eps', eps);

      resolve({ sid: newSid });
    });
  },
  reloadSid: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      try {
        const sid = sessionStorage.getItem('sid');
        const eps = sessionStorage.getItem('eps');

        if (!sid || !eps) {
          reject();
        }

        const password = decryptText(`${eps}`, `${sid}`);

        const newSid = await getLoginSid({ password: password });

        if (newSid && newSid.includes('ERROR')) {
          reject({ error: true });
        }

        if (!newSid) {
          sessionStorage.removeItem('sid');
          reject();
        }

        const newEps = encryptText(password, newSid);

        sessionStorage.setItem('sid', newSid);
        sessionStorage.setItem('eps', newEps);

        resolve({ sid: newSid });
      } catch (error) {
        reject();
      }
    });
  },
  reloadIfStatus: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      const sid = context.sid;

      if (!sid) {
        reject();
      }

      const ifStatus = await getIfStatus({ sid });
      resolve({ ifStatus });
    });
  },
  reloadUptime: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      const sid = context.sid;

      if (!sid) {
        reject();
      }

      const uptime = await getUptime({ sid });

      resolve({ uptime });
    });
  },
  reloadInternetStatus: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      const sid = context.sid;

      if (!sid) {
        reject();
      }

      const isConnectedToInternet = await getInternetStatus({ sid });
      resolve({ isConnectedToInternet });
    });
  },
  reloadDevices: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      const sid = context.sid;

      if (!sid) {
        reject();
      }

      const devices = await getDevices({ sid });
      resolve({ devices });
    });
  },
  reloadWifiInfo: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      const sid = context.sid;

      if (!sid) {
        reject();
      }

      const wlanInfo = await getWifiStatus({ sid });

      resolve({ wlanInfo });
    });
  },
  reloadConfigFile: async (context: ContextData, event: Event) => {
    return new Promise(async (resolve, reject) => {
      const sid = context.sid;

      if (!sid) {
        reject();
      }

      const configs = await getWifiConfigFile({ sid });

      resolve({ configs });
    });
  },
  updateFirstUseData: assign((context: ContextData, event: Event) => {
    sessionStorage.removeItem('sid');
    sessionStorage.removeItem('eps');

    if (event.data.error) {
      return {
        firstUse: true,
        isLoggedIn: false,
        serverNotAvailable: true,
      };
    }

    return {
      sid: event.data.sid,
      firstUse: event.data.firstUse,
      updateAuthData: true,
    };
  }),
  updateAuthData: assign((context: ContextData, event: Event) => {
    // console.log('updateAuthData', event.data);
    return {
      sid: event.data?.sid ?? context.sid,
      isLoggedIn: true,
      times: context.times + 1,
      firstUse: event.data?.firstUse ?? context.firstUse,
      updateAuthData: true,
    };
  }),
  updateReloadSid: assign((context: ContextData, event: Event) => {
    // console.log('updateAuthData', event.data);
    return {
      sid: event.data?.sid ?? context.sid,
      isLoggedIn: true,
      times: context.times + 1,
      firstUse: event.data?.firstUse ?? context.firstUse,
      updateAuthData: true,
      sidTimeout: new Date(),
    };
  }),
  loginError: assign((context: ContextData, event: Event) => {
    return {
      isLoggedIn: false,
      times: context.times + 1,
    };
  }),
  cleanAuthData: assign((context: ContextData, event: Event) => {
    sessionStorage.removeItem('sid');

    if (context.uptime === 0) {
      sessionStorage.removeItem('sid');
    }

    return {
      sid: '',
      isLoggedIn: false,
    };
  }),
  updateLanguage: assign((context: ContextData, event: Event) => {
    return {
      language: event.data,
      times: context.times + 1,
    };
  }),
  updateDevices: assign((context: ContextData, event: Event) => {
    return {
      devices: event.data.devices,
      times: context.times + 1,
    };
  }),
  updateInternetStatus: assign((context: ContextData, event: Event) => {
    return {
      isConnectedToInternet: event.data?.isConnectedToInternet,
    };
  }),
  updateWifiInfo: assign((context: ContextData, event: Event) => {
    return {
      wlanInfo: event.data.wlanInfo,
      cycle: context.cycle + 1,
      times: context.times + 1,
    };
  }),
  updateRobots: assign((context: ContextData, event: Event) => {

    const idsRobots = event.data.robots.map((robot:any)=>robot.nodeId)
    const tempRobots = context.robots.map((robot) => idsRobots.includes(robot.nodeId))
    const conectedRobots = tempRobots.filter((robot) => robot.status === 'disconected')

    return {
      robots: conectedRobots,
      times: context.times + 1,
    };
  }),
  updateConfigFile: assign((context: ContextData, event: Event) => {
    return {
      configs: event.data.configs,
      times: context.times + 1,
    };
  }),
  udpateFirstUse: assign((context: ContextData, event: Event) => {
    sessionStorage.setItem('firstUse', 'false');
    return {
      firstUse: false,
      times: context.times + 1,
    };
  }),
  updateBatteryRobots: assign((context: ContextData, event: Event) => {
    const robots = context.robots.map((robot) => {
      if (robot.nodeId === event.data.nodeId) {
        return {
          ...robot,
          variables: {
            ...robot.variables,
            battery: event.data.battery,
          },
        };
      }

      return robot;
    });

    return {
      robots,
      times: context.times + 1,
    };
  }),
  updateIfStatus: assign((context: ContextData, event: Event) => {
    return {
      ifStatus: event.data.ifStatus,
      times: context.times + 1,
    };
  }),
  updateUptime: assign((context: ContextData, event: Event) => {
    return {
      uptime: event.data.uptime,
      times: context.times + 1,
    };
  }),
};

const guards = {
  isLogged: (context: ContextData, event: Event) => {
    return !!context.sid;
  },
  reloadSIdTimeCondition: (context: ContextData, event: Event) => {
    const sidTimeout = new Date(context.sidTimeout);
    const now = new Date();

    if (now.getTime() - sidTimeout.getTime() > 1000 * 60 * 5) {
      return false;
    }

    return true; // o false, según tu lógica
  },
  serverIsAvailable: (context: ContextData, event: Event) => {
    return !context.serverNotAvailable;
  },
};

const observeEvents = {
  updateLanguage: {
    actions: 'updateLanguage',
  },
  updateDevices: {
    actions: 'updateDevices',
  },
  updateWifiInfo: {
    actions: 'updateWifiInfo',
  },
  updateInternetStatus: {
    actions: 'updateInternetStatus',
  },
  updateRobots: {
    actions: 'updateRobots',
  },
  updateBatteryRobots: {
    actions: 'updateBatteryRobots',
  },
  updateConfigFile: {
    actions: 'updateConfigFile',
  },
  updateIfStatus: {
    actions: 'updateIfStatus',
  },
  updateUptime: {
    actions: 'updateUptime',
  },
  UPDATE_DATA: 'updateConfigFile',
  LOGIN: 'sendingLoginData',
  DISCONNECT: 'disconnected',
  COMPLET_STEP_FIRSTUSE: {
    actions: 'udpateFirstUse',
  },
};

export const machine = createMachine<ContextData>(
  {
    predictableActionArguments: true,
    id: 'stateMachine',
    initial: 'start',
    context: initialState,
    states: {
      start: {
        invoke: {
          id: 'startData',
          src: actions.getSessionData,
          onDone: {
            target: 'reNewSid',
            actions: 'updateAuthData',
          },
          onError: {
            target: 'notLogged',
            actions: 'updateFirstUseData',
          },
        },
      },
      notLogged: {
        on: {
          LOGIN: 'sendingLoginData',
          LOGOUT: 'disconnected',
          updateRobots: {
            actions: 'updateRobots',
          },
          updateLanguage: {
            actions: 'updateLanguage',
          },
        },
      },
      sendingLoginData: {
        invoke: {
          id: 'sendingLoginData',
          src: actions.login,
          onDone: {
            target: 'iddle',
            actions: 'updateAuthData',
          },
          onError: {
            target: 'notLogged',
            actions: 'updateFirstUseData',
          },
        },
      },
      reloadSid: {
        invoke: {
          id: 'reloadSid',
          src: actions.reloadSid,
          onDone: {
            target: 'iddle',
            actions: 'updateReloadSid',
          },
          onError: {
            target: 'notLogged',
            actions: 'updateFirstUseData',
          },
        },
        on: observeEvents,
      },
      reNewSid: {
        invoke: {
          id: 'reloadSid',
          src: actions.reloadSid,
          onDone: {
            target: 'updateIfStatus',
            actions: 'updateAuthData',
          },
          onError: {
            target: 'notLogged',
          },
        },
        on: observeEvents,
      },
      updateIfStatus: {
        invoke: {
          id: 'updateIfStatus',
          src: actions.reloadIfStatus,
          onDone: {
            target: 'updateUptime',
            actions: 'updateIfStatus',
          },
          onError: {
            target: 'disconnected',
          },
        },
        on: observeEvents,
      },
      updateUptime: {
        invoke: {
          id: 'updateUptime',
          src: actions.reloadUptime,
          onDone: {
            target: 'updateInternetStatus',
            actions: 'updateUptime',
          },
          onError: {
            target: 'disconnected',
          },
        },
        on: observeEvents,
      },
      updateInternetStatus: {
        invoke: {
          id: 'updateInternetStatus',
          src: actions.reloadInternetStatus,
          onDone: {
            target: 'updateDevices',
            actions: 'updateInternetStatus',
          },
          onError: {
            target: 'disconnected',
          },
        },
        on: observeEvents,
      },
      updateDevices: {
        invoke: {
          id: 'updateDevices',
          src: actions.reloadDevices,
          onDone: {
            target: 'updateConfigFile',
            actions: 'updateDevices',
          },
          onError: {
            target: 'disconnected',
          },
        },
        on: observeEvents,
      },
      updateConfigFile: {
        invoke: {
          id: 'updateConfigFile',
          src: actions.reloadConfigFile,
          onDone: {
            target: 'updateWifiInfo',
            actions: 'updateConfigFile',
          },
          onError: {
            target: 'disconnected',
          },
        },
        on: observeEvents,
      },
      updateWifiInfo: {
        invoke: {
          id: 'updateWifiInfo',
          src: actions.reloadWifiInfo,
          onDone: {
            target: 'iddle',
            actions: 'updateWifiInfo',
          },
          onError: {
            target: 'disconnected',
          },
        },
        on: observeEvents,
      },
      iddle: {
        after: {
          60000: { target: 'reloadSid' },
          30000: { cond: 'reloadSIdTimeCondition', target: 'updateIfStatus' },
        },
        on: observeEvents,
      },
      disconnected: {
        entry: 'cleanAuthData',
        after: {
          1000: { cond: 'serverIsAvailable', target: 'start' },
        },
        on: observeEvents,
      },
    },
  },
  {
    actions,
    guards,
  },
);

export const stateService = interpret(machine)
  .onTransition((state) => {
    // console.log('state change::', state.value);
  })
  .onEvent((event) => {
    // console.log('event::', event);
  })
  .start();

export const StateContext = createContext<any>({});

const extractIPAddress = (ipMask: string) => {
  const parts = ipMask.split('/');
  if (parts.length > 0) {
    return parts[0];
  }
  return null; // Devuelve null si no se puede extraer la dirección IP
};

export const StateProvider = ({ children }: { children: React.ReactNode }) => {
  const services = useActor(stateService);
  const timeCharged = useRef<{ [uuid: string]: Date }>({});
  const [TDMActive, setTDMActive] = useState(false);

  useEffect(() => {
    if (!TDMActive && services[0].context.isLoggedIn && services[0]?.context?.ifStatus?.route[0]?.source) {
      // console.log('tdmClient', 'connecting');
      const host = extractIPAddress(services[0].context.ifStatus.route[0].source);

      // console.log('tdmClient', `ws://${host}:8597`);

      createClient(`ws://${host}:8597`).onNodesChanged = async (nodes: INode[]) => {
        const _nodes = await Promise.all(
          nodes.map(async (node: INode) => {
            // console.log(`Found ${node.name} ${node.id} `);
            const nodeId = node.id.toString().replace(/[^a-zA-Z0-9 -]/g, '');
            const { name } = node;

            node.watchSharedVariablesAndEvents(true);

            node.onGroupChanged = (group: IGroup) => {
              console.log('group change', group);
            };

            node.onVariablesChanged = (variables: Variables) => {
              const _vbat = variables.get('_vbat');
              if (_vbat) {
                const now = new Date();

                if (
                  timeCharged.current[nodeId] === undefined ||
                  now.getTime() - timeCharged.current[nodeId].getTime() > 1000 * 2
                ) {
                  services[1]({ type: 'updateBatteryRobots', data: { nodeId, battery: _vbat[0] } });
                  timeCharged.current[nodeId] = new Date();
                }
              }
            };

            return { nodeId, name, status: node.statusAsString, type: node.typeAsString, variables: {} };
          }),
        );

        // console.log('tdmClient', { robots: _nodes });
        services[1]({ type: 'updateRobots', data: { robots: _nodes } });
        setTDMActive(true);
        // setRouterData({ ...routerData, robots: _nodes });
      };
    }
  }, [services[0].context.isLoggedIn, services[0].context.ifStatus]);

  return <StateContext.Provider value={{ services }}>{children}</StateContext.Provider>;
};

export const useDataState = () => {
  const {
    services: [current],
  } = useContext(StateContext);

  return current.context as ContextData;
};

export const useStateMachine = () => {
  const {
    services: [Mcurrent, Msend],
  } = useContext(StateContext);

  // return state of machine
  return Mcurrent.value;
};

export const useEmitter = () => {
  const {
    services: [current, sendEvent],
  } = useContext(StateContext);

  const emit = ({ event, data }: ServiceEvent) => {
    sendEvent({ type: event, data: data });
  };

  return emit as (data: ServiceEvent) => void;
};
