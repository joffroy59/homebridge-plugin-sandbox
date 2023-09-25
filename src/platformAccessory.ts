import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

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

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    Brightness: 100,
  };

  private updateInterval: number;

  constructor(
    private readonly platform: SandboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.platform.log.info('Init  SandboxPlatformAccessory');
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, platform.config.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, platform.config.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, platform.config.serialNumber + '-' + accessory.displayName);

    this.updateInterval = accessory.context.device.updateInterval;

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.configDeviceName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));       // SET - bind to the 'setBrightness` method below

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

    sensorName = accessory.context.device.motionSensorName2;
    sensorIdentifier = accessory.context.device.motionSensorIdentifier2;
    const motionSensorTwoService = this.createSensor(this.platform.Service.MotionSensor, sensorName, sensorIdentifier);

    // Add 1 "temperature sensor" services to the accessory
    sensorName = accessory.context.device.temperatureSensorName1;
    sensorIdentifier = accessory.context.device.temperatureSensorIdentifier1;
    this.temperatureService = this.createSensor(this.platform.Service.TemperatureSensor, sensorName, sensorIdentifier);

    const sn = this.initAccessoryInformation();
    this.platform.log.info(`filename sn=${sn}`);

    this.initFakeGatoHistory();

    // create handlers for required characteristics
    /* this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this)); */
    this.createHandlers(motionSensorOneService, motionSensorTwoService);
  }

  private createSensor(sensorTypoe, sensorName, sensorIdentifier) {
    this.platform.log.info(`createSensor or reuse  sensorName=${sensorName}, sensorIdentifier=${sensorIdentifier}`);
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
  private createHandlers(motionSensorOneService: Service, motionSensorTwoService: Service) {
    let motionDetected = false;
    setInterval(() => {
      // EXAMPLE - inverse the trigger
      motionDetected = !motionDetected;

      // push the new value to HomeKit
      motionSensorOneService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
      motionSensorTwoService.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);

      this.platform.log.info('Triggering motionSensorOneService:', motionDetected);
      this.platform.log.info(`Update FakegatoService ${this.traceService(motionSensorOneService)}:`, motionDetected);
      this.fakegatoService.addEntry({
        time: new Date().getTime() / 1000,
        motion: motionDetected ? 1 : 0,
      });

      this.platform.log.info('Triggering motionSensorTwoService:', !motionDetected);
    }, 1000 * this.updateInterval);

    let newTemperature = 0.0;
    setInterval(() => {
      // EXAMPLE - trigger Temperature random
      newTemperature = this.generateRandomTemperature();

      // push the new value to HomeKit
      this.temperatureService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, newTemperature);
      this.platform.log.info(`Triggering TemperatureService [${this.accessory.displayName}]:`, newTemperature);
      this.platform.log.info(`Update FakegatoService ${this.traceService(this.temperatureService)}:`, newTemperature);
      this.fakegatoService.addEntry({
        time: new Date().getTime() / 1000,
        temp: newTemperature,
      });
    }, 1000 * this.updateInterval);
  }

  private initFakeGatoHistory() {
    const filename = `fakegato-history_Sandbox-${this.accessory.displayName}.json`;
    this.platform.log.info(`filename filename=${filename}`);
    this.platform.log.info('filename filename=', filename);
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
    this.platform.log.info('Triggered GET CurrentTemperature');

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

    this.platform.log.debug('Set Characteristic On ->', value);
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

    this.platform.log.debug('Get Characteristic On ->', isOn);

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

    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

}
