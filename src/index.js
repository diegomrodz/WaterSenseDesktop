(function ($, Morris) {
    //var SerialPort = require('serialport').SerialPort;

    var NWGui = require('nw.gui');
    var NWWindow = NWGui.Window.get();

    var DummyDevice = (function () {
        var DummyDevice = new Function();

        function rand(a, b) {
            return (Math.random() * a) + b;
        }

        DummyDevice.prototype.getSignal = function () {
            var signal = "";

            signal += "TE:" + rand(20, 35).toPrecision(4) + ";";
            signal += "TA:" + rand(15, 30).toPrecision(4) + ";";
            signal += "LU:" + rand(120, 450).toPrecision(4) + ";";

            return signal;
        };

        return DummyDevice;
    }());

    var LastMeasurementsPanelWidget = (function () {
        var LastMeasurementsPanelWidget = new Function();
        
        LastMeasurementsPanelWidget.prototype.dom = $("#LastMeasurementsPanel");

        LastMeasurementsPanelWidget.prototype.externalTemperature = $("#LastMeasurementsPanel-ExternalTemperatureLabel");
        LastMeasurementsPanelWidget.prototype.waterTemperature = $("#LastMeasurementsPanel-WaterTemperatureLabel");
        LastMeasurementsPanelWidget.prototype.luminosity = $("#LastMeasurementsPanel-LuminosityLabel");

        LastMeasurementsPanelWidget.prototype.updateExternalTemperature = function (temperature) {
            this.externalTemperature.text("Última Medição: " + temperature + "ºC");
        };

        LastMeasurementsPanelWidget.prototype.updateWaterTemperature = function (temperature) {
            this.waterTemperature.text("Última Medição: " + temperature + "ºC");
        };

        LastMeasurementsPanelWidget.prototype.updateLuminosity = function (luminosity) {
            this.luminosity.text("Última Medição: " + luminosity);
        };

        return LastMeasurementsPanelWidget;
    }());

    var MainPlotPanelWidget = (function () {
        var MainPlotPanelWidget = new Function();

        MainPlotPanelWidget.prototype.CHART_ID = "MainPlotChart";

        MainPlotPanelWidget.prototype.chart = undefined;

        MainPlotPanelWidget.prototype.graphData = [];

        MainPlotPanelWidget.prototype.start = function () {
            this.chart = new Morris.Line({
                element: this.CHART_ID,
                data: this.graphData,
                xkey: 'timestamp',
                ykeys: ['value'],
                labels: ['Value'],
                dateFormat: function (x) {
                    return new Date(x).toString();
                }
            });
        };

        MainPlotPanelWidget.prototype.insert = function (value) {
            this.graphData.push({
                "value" : value,
                "timestamp" : (new Date()).getTime()
            });
        };

        MainPlotPanelWidget.prototype.update = function () {
            this.chart.setData(this.graphData);
        };

        return MainPlotPanelWidget;
    }());

    var SensorSignal = (function () {
        var SensorSignal = new Function();

        SensorSignal.prototype.CONST_EXT_TEMP_IDENTIFIER = "TE";
        SensorSignal.prototype.CONST_WATER_TEMP_IDENTIFIER = "TA";
        SensorSignal.prototype.CONST_LUMINOSITY_IDENTIFIER = "LU";

        SensorSignal.prototype.externalTemperature = undefined;
        SensorSignal.prototype.waterTemperature = undefined;
        SensorSignal.prototype.luminosity = undefined;

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

        WaterSenseApplication.prototype.lastMeasurementPanel = new LastMeasurementsPanelWidget();
        WaterSenseApplication.prototype.mainPlotPanel = new MainPlotPanelWidget();

        WaterSenseApplication.prototype.dummyDevice = new DummyDevice();

        WaterSenseApplication.prototype.update = function () {
            var signal = new SensorSignal();

            signal.digestSignal(this.dummyDevice.getSignal());

            this.lastMeasurementPanel.updateExternalTemperature(signal.externalTemperature);
            this.lastMeasurementPanel.updateWaterTemperature(signal.waterTemperature);
            this.lastMeasurementPanel.updateLuminosity(signal.luminosity);
        };

        WaterSenseApplication.prototype.main = function () {
            var self = this;
            //this.serialPort = new SerialPort(this.DEFAULT_SERIAL_PORT);

            NWWindow.width = this.WINDOW_WIDTH;
            NWWindow.height = this.WINDOW_HEIGHT;

            NWWindow.setResizable(false);

            NWWindow.moveTo(0, 0);

            this.mainPlotPanel.start();

            setInterval(function () {
                self.update();
                self.mainPlotPanel.insert(self.externalTemperature);
                self.mainPlotPanel.update();
            }, 2000);
        };

        return WaterSenseApplication;
    }());

    var App = new WaterSenseApplication();

    App.main();
}).call(this, jQuery, Morris);