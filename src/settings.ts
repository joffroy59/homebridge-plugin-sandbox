import { PlatformConfig } from 'homebridge';

/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'SandboxHomebridgePlugin';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-plugin-sandbox';

//Config
export interface SandboxPlatformConfig extends PlatformConfig {
    options?: options | Record<string, never>;
}

export type options = {
    devices?: Array<devicesConfig>;
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
};


export type lightBulb = {
    disableLightBulb?: boolean | false;
};

export type motionSensor = {
    motionSensorUpdateInterval?: number | 5;
    motionSensorName1?: string;
    motionSensorIdentifier1?: string;
};

export type temperatureSensor = {
    temperatureSensorUpdateInterval?: number | 7;
    temperatureSensorName1?: string;
    temperatureSensorIdentifier1?: string;
};

export interface devicesConfig extends device {
    configDeviceName?: string;
    uniqueId?: string;
    updateInterval?: number | 5;
    lightBulb: lightBulb;
    motionSensor: motionSensor;
    temperatureSensor: temperatureSensor;
}

export type device = {
    deviceId?: string;
    deviceName: string;
    deviceType: string;
};

