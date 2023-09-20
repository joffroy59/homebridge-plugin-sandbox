import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, Test1PlatformConfig } from './settings';
import { Test1PlatformAccessory } from './platformAccessory';
import fakegato from 'fakegato-history';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class Test1HomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  public FakeGatoHistoryService;

  constructor(
    public readonly log: Logger,
    public readonly config: Test1PlatformConfig,
    public readonly api: API,
  ) {


    this.log.info('Finished initializing platform:', this.config.name);

    // verify the config
    // try {
    this.verifyConfig();
    this.log.debug('Config OK');
    // } catch (e: any) {
    //   this.log.error(`Verify Config, Error Message: ${e.message}, Submit Bugs Here: ` + 'https://tinyurl.com/SwitchBotBug');
    //   this.log.debug(`Verify Config, Error: ${e}`);
    //   return;
    // }


    this.FakeGatoHistoryService = fakegato(this.api);


    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
  * Verify the config passed to the plugin is valid
  */
  async verifyConfig() {
    this.config.options = this.config.options || {};

    const platformConfig = {};
    if (Object.entries(platformConfig).length !== 0) {
      this.log.warn(`Platform Config: ${JSON.stringify(platformConfig)}`);
    }
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    // const exampleDevices = [
    //   {
    //     exampleUniqueId: 'ABCD',
    //     exampleDisplayName: 'Bedroom',
    //   },
    //   {
    //     exampleUniqueId: 'EFGH',
    //     exampleDisplayName: 'Kitchen',
    //   },
    // ];
    const devices = this.config.options?.devices;

    if (!devices) {
      this.log.debug('No devices defined in config');
    } else {
      for (const device of devices) {

        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        // number or MAC address
        const uuid = this.api.hap.uuid.generate(`${device.uniqueId}`);

        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
          // the accessory already exists
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new Test1PlatformAccessory(this, existingAccessory);

          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        } else {
          // the accessory does not yet exist, so we need to create it
          this.log.info('Adding new accessory:', device.configDeviceName);

          // create a new accessory
          const accessory = new this.api.platformAccessory(`${device.configDeviceName}`, uuid);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device = device;

          // create the accessory handler for the newly create accessory
          // this is imported from `platformAccessory.ts`
          new Test1PlatformAccessory(this, accessory);

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      }
    }

  }
}
