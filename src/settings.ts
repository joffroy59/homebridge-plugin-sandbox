import { PlatformConfig } from 'homebridge';

/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'Test1HomebridgePlugin';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-plugin-test1';

//Config
export interface Test1PlatformConfig extends PlatformConfig {
    options?: options | Record<string, never>;
}

export type options = {
    devices?: Array<devicesConfig>;
};

export interface devicesConfig extends device {
    configDeviceName?: string;
    uniqueId?: string;
    updateInterval?: number | 5;
}

export type device = {
    deviceId?: string;
    deviceName: string;
    deviceType: string;
};

