(function () {
    //var SerialPort = require('./../node_modules/serialport').SerialPort;

    var NWGui = require('nw.gui');
    var NWWindow = NWGui.Window.get();

    var SensorSignal = (function () {
        var SensorSignal = new Function();

        SensorSignal.prototype.CONST_EXT_TEMP_IDENTIFIER = "TE";
        SensorSignal.prototype.CONST_WATER_TEMP_IDENTIFIER = "TA";
        SensorSignal.prototype.CONST_LUMINOSITY_IDENTIFIER = "LU";

        SensorSignal.prototype.externalTemperature = 0;
        SensorSignal.prototype.waterTemperature = 0;
        SensorSignal.prototype.luminosity = 0;

        SensorSignal.prototype.digestSignal = function (rawSignal) {
            var parts = rawSignal.split(";");
            var i = 0, len = parts.length;

            for (; i < len - 1; i += 1) {
                var aux = parts[i].split(":");

                if (aux[0] === this.CONST_EXT_TEMP_IDENTIFIER) {
                    this.externalTemperature = parseFloat(aux[1]);
                } else if (aux[0] === this.CONST_WATER_TEMP_IDENTIFIER) {
                    this.waterTemperature = parseFloat(aux[1]);
                } else if (aux[0] === this.CONST_LUMINOSITY_IDENTIFIER) {
                    this.luminosity = parseFloat(aux[1]);
                }
            }
        };

        return SensorSignal;
    }());

    var WaterSenseApplication = (function () {
        var WaterSenseApplication = new Function();

        WaterSenseApplication.prototype.DEFAULT_SERIAL_PORT = "COM3";

        WaterSenseApplication.prototype.WINDOW_WIDTH = 1024;
        WaterSenseApplication.prototype.WINDOW_HEIGHT = 600;

        WaterSenseApplication.prototype.serialPort = undefined;

        WaterSenseApplication.prototype.main = function () {
            //this.serialPort = new SerialPort(this.DEFAULT_SERIAL_PORT);

            NWWindow.width = this.WINDOW_WIDTH;
            NWWindow.height = this.WINDOW_HEIGHT;

            NWWindow.setResizable(false);

            NWWindow.moveTo(0, 0);
        };

        return WaterSenseApplication;
    }());

    var App = new WaterSenseApplication();

    App.main();
}).call(this);