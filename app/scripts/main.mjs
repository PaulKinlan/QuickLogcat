/*!
 *
 *  Quick LogCat Code scanner.
 *  Copyright 2019 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR COND5ITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

import { Adb } from './webadb.js';

/*

Some thoughts on future archtecture. 
Need to probably think of a way to create commands, that can then be stopped via UI vs this lump of code.

*/

export default class LogcatController {

  constructor() {
    this._webusb = null;
    this._fastboot = null;
    this._adb = null;
  }

  connect = async () => {
    try {
      if (this._webusb != null) {
        disconnect_usb();
        return;
      } else {
        this._webusb = await Adb.open("WebUSB");
      }

      if (!this._webusb || !(this._webusb.isAdb() || this._webusb.isFastboot()))
        throw new Error("Could not open either ADB or Fastboot");
    }
    catch (error) {
      console.log(error);
      this._webusb = null;
      return;
    }

    if (this._webusb.isFastboot()) {
      try {
        this._fastboot = null;
        this._fastboot = await this._webusb.connectFastboot();
        if (fastboot != null) {
          console.log("FASTBOOT mode");
        }
      }
      catch (error) {
        console.log(error);

        this._fastboot = null;
        this._webusb = null;
        return;
      }
    }

    if (this._webusb.isAdb()) {
      try {
        this._adb = null;
        this._adb = await this._webusb.connectAdb("host::", () =>
          console.log("Please check the screen of your " + this._webusb.device.productName + "."));

        if (this._adb != null) {
          console.log("ADB mode");
          // Connected
        }
      }
      catch (error) {
        console.log(error);
        this._adb = null;
        this._webusb = null;
        return;
      }
    }
  };

  logcat = async (output = () => {}) => {
    let decoder = new TextDecoder();
    let adb = this._adb;
    let fastboot = this._fastboot;

    try {
      if (adb != null) {
        let shell = await adb.open('shell:logcat');
        let r = await shell.receive();
        while (r.cmd == "WRTE") {
          if (r.data != null) {
            // Log the data decoder.decode(r.data)
            output(decoder.decode(r.data));
          }

          shell.send("OKAY");
          r = await shell.receive();
        }

        shell.close();
        shell = null;
      }

      if (fastboot != null) {

        await fastboot.send('logcat');
        let r = await fastboot.receive();
        while (fastboot.get_cmd(r) == "INFO") {
          output(decoder.decode(fastboot.get_payload(r)) + "\n");
          r = await fastboot.receive();
        }

        let payload = fastboot.get_payload(r);
        if (payload.length > 0)
          payload += "\n";
        output(output() + decoder.decode(payload));

      }
    }
    catch (error) {
      console.log(error);
      this._webusb = null;
      this._fastboot = null;
    }
  }
};