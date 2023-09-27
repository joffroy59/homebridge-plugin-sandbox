import { Service, PlatformAccessory, CharacteristicValue, Logger } from 'homebridge';

import { SandboxHomebridgePlatform } from './platform';
import fakegato from 'fakegato-history';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SandboxPlatformAccessory {
  private service: Service;
  private temperatureService: Service;
  private fakegatoService: fakegato.FakeGatoHistoryService;
  private log: Logger;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    Brightness: 100,
  };

  private updateInterval: number;
  private motionSensorUpdateInterval: number;
  private temperatureSensorUpdateInterval: number;

  private disableLightBulb: boolean;

  private configDeviceName: string;

  constructor(
    private readonly platform: SandboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.log = this.platform.log;
    this.logInfo('Init  SandboxPlatformAccessory');
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, platform.config.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, platform.config.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, platform.config.serialNumber + '-' + accessory.displayName);

    this.updateInterval = accessory.context.device.updateInterval;
    this.disableLightBulb = accessory.context.device.disableLightBulb;
    this.configDeviceName = accessory.context.device.configDeviceName;
    this.motionSensorUpdateInterval = accessory.context.device.motionSensorUpdateInterval;
    // this.motionSensorUpdateInterval = 10;
    this.logInfo(`motionSensorUpdateInterval=${this.motionSensorUpdateInterval}`);

    this.temperatureSensorUpdateInterval = accessory.context.device.temperatureSensorUpdateInterval;
    // this.temperatureSensorUpdateInterval = 10;
    this.logInfo(`temperatureSensorUpdateInterval=${this.temperatureSensorUpdateInterval}`);

    if (!this.disableLightBulb){
      this.service = createLightBuld(this);
    }

    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same sub type id.)
     */

    // Example: add two "motion sensor" services to the accessory
    let sensorName = accessory.context.device.motionSensorName1;
    let sensorIdentifier = accessory.context.device.motionSensorIdentifier1;
    const motionSensorOneService = this.createSensor(this.platform.Service.MotionSensor, sensorName, sensorIdentifier);

    // Add 1 "temperature sensor" services to the accessory
    sensorName = accessory.context.device.temperatureSensorName1;
    sensorIdentifier = accessory.context.device.temperatureSensorIdentifier1;
    this.temperatureService = this.createSensor(this.platform.Service.TemperatureSensor, sensorName, sensorIdentifier);

    const sn = this.initAccessoryInformation();
    this.logInfo(`filename sn=${sn}`);

    this.initFakeGatoHistory();

    // create handlers for required characteristics
    /* this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this)); */
    this.createHandlers(motionSensorOneService);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    function createLightBuld(accessory: SandboxPlatformAccessory) {
      const service = accessory.accessory.getService(accessory.platform.Service.Lightbulb)
        || accessory.accessory.addService(accessory.platform.Service.Lightbulb);

      // set the service name, this is what is displayed as the default name on the Home app
      // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
      accessory.service.setCharacteristic(accessory.platform.Characteristic.Name, accessory.context.device.configDeviceName);

      // each service must implement at-minimum the "required characteristics" for the given service type
      // see https://developers.homebridge.io/#/service/Lightbulb
      // register handlers for the On/Off Characteristic
      accessory.service.getCharacteristic(accessory.platform.Characteristic.On)
        .onSet(accessory.setOn.bind(accessory)) // SET - bind to the `setOn` method below
        .onGet(accessory.getOn.bind(accessory)); // GET - bind to the `getOn` method below


      // register handlers for the Brightness Characteristic
      accessory.service.getCharacteristic(accessory.platform.Characteristic.Brightness)
        .onSet(accessory.setBrightness.bind(accessory));       // SET - bind to the 'setBrightness` method below

      return service;
    }
  }

  private createSensor(sensorTypoe, sensorName, sensorIdentifier) {
    this.logInfo(`createSensor or reuse  sensorName=${sensorName}, sensorIdentifier=${sensorIdentifier}`);
    return this.accessory.getService(sensorName) || this.accessory.addService(sensorTypoe, sensorName, sensorIdentifier);
  }

  private initAccessoryInformation() {
    return this.accessory.getService(this.platform.Service.AccessoryInformation)
      ?.getCharacteristic(this.platform.Characteristic.SerialNumber);
  }

  /**
   * Updating characteristics values asynchronously.
   *
   * Example showing how to update the state of a Characteristic asynchronously instead
   * of using the `on('get')` handlers.
   * Here we change update the motion sensor trigger states on and off every 10 seconds
   * the `updateCharacteristic` method.
   *
   */
  private createHandlers(motionSensorOneService: Service) {
    let motionDetected = false;
    setInterval(() => {
      // EXAMPLE - inverse the trigger
      motionDetected = !motionDetected;

      // push the new value to HomeKit
      motionSensorOneService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);

      this.logInfo(`Triggering motionSensorOneService: ${motionDetected}`);
      this.logInfo(`Update FakegatoService ${this.traceService(motionSensorOneService)}: ${motionDetected}`);
      this.logInfo(`MotionSensor Update rate = ${ (1000 * this.motionSensorUpdateInterval )/1000}`);
      this.fakegatoService.addEntry({
        time: new Date().getTime() / 1000,
        motion: motionDetected ? 1 : 0,
      });
    }, 1000 * this.motionSensorUpdateInterval);
    //TODO use default this.updateInterval if not set

    let newTemperature = 0.0;
    setInterval(() => {
      // EXAMPLE - trigger Temperature random
      newTemperature = this.generateRandomTemperature();

      // push the new value to HomeKit
      this.temperatureService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, newTemperature);
      this.logInfo(`Triggering TemperatureService [${this.accessory.displayName}]: ${newTemperature
      }`);
      this.logInfo(`Update FakegatoService ${this.traceService(this.temperatureService)}: `
        + `${newTemperature}`);
      this.logInfo(`TemperatureSensor Update rate = ${(1000 * this.temperatureSensorUpdateInterval)
        / 1000}`);
      this.fakegatoService.addEntry({
        time: new Date().getTime() / 1000,
        temp: newTemperature,
      });
    }, 1000 * this.temperatureSensorUpdateInterval);
    //TODO use default this.updateInterval if not set
  }

  private initFakeGatoHistory() {
    const filename = `fakegato-history_Sandbox-${this.accessory.displayName}.json`;
    this.logInfo(`filename filename=${filename}`);
    this.fakegatoService = new this.platform.FakeGatoHistoryService('custom', this.accessory, {
      filename,
      disableTimer: true,
      storage: 'fs',
      log: this.platform.log,
      minutes: 1,
    });
  }

  private traceService(service) {
    return `[${this.accessory.displayName}]`
      + `(${service.displayName}|${service.UUID})`;
  }

  generateRandomTemperature(): number {
    const minTemperature = 20.0;
    const maxTemperature = 22.0;
    const randomTemperature = Math.random() * (maxTemperature - minTemperature) + minTemperature;
    return Number(randomTemperature.toFixed(2)); // Arrondir à 2 décimales
  }

  /**
 * Handle requests to get the current value of the "Current Temperature" characteristic
 */
  handleCurrentTemperatureGet() {
    this.logInfo('Triggered GET CurrentTemperature');

    // set this to a valid value for CurrentTemperature
    const currentValue = 12.4;

    return currentValue;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.exampleStates.On = value as boolean;

    this.logInfo(`Set Characteristic On ->${value}`);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.exampleStates.On;

    this.logInfo(`Get Characteristic On ->${isOn}`);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    this.exampleStates.Brightness = value as number;

    this.logInfo(`Set Characteristic Brightness -> ${value}`);
  }

  private logInfo(msg: string) {
    this.log.info(`[${this.configDeviceName}]  ${msg}`);
  }

  private logDebug(msg: string) {
    this.log.debug(msg);
  }

}
